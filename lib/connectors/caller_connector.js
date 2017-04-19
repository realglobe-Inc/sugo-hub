/**
 * Connector for caller
 * @augments Connector
 * @class CallerConnector
 */
'use strict'

const co = require('co')
const Connector = require('./connector')

const { RemoteEvents, ReservedEvents } = require('sg-socket-constants')
const { PIPE, JOIN, LEAVE, PERFORM } = RemoteEvents

const { DISCONNECT } = ReservedEvents
const uuid = require('uuid')
const debug = require('debug')('sg:hub:caller')

/** @lends CallerConnector */
class CallerConnector extends Connector {

  /**
   * @override
   */
  handleConnection (socket, scope) {
    const s = this
    let { logger } = s
    let {
      actorService,
      callerService,
      invocationService,
      actorIO
    } = scope
    let { id } = socket

    const callerInfo = (caller, messages) => ({
      caller: {
        key: caller.key
      },
      messages
    })

    // Handle join request from caller
    socket.on(JOIN, s.ack(function * handleJoin (data = {}) {
      let { key, messages } = data

      let actor = yield actorService.find(key, { strict: true })
      let caller = yield callerService.joinToActor(id, actor)

      if (!actor) {
        throw new Error(`[SUGO-Hub][JOIN] actor not found for key: ${key}`)
      }
      actor.addCaller(caller)
      debug(`Join caller "${caller.key}" to actor "${key}"`)
      logger.info(`Join caller "${caller.key}" to actor "${key}"`)
      yield actorService.save(actor)
      actorIO.to(actor.socketId).emit(JOIN, callerInfo(caller, messages))

      return [ {
        key: actor.key,
        specs: actor.$specs,
        as: caller.key
      } ]
    }))

    // Handle leave request from caller
    socket.on(LEAVE, s.ack(function * handleLeave (data = {}) {
      let { key, messages } = data
      let actor = yield actorService.find(key, { strict: false })
      if (!actor) {
        debug(`Skip leaving caller from actor "${key}" since actor already gone.`)
        return []
      }
      let caller = yield callerService.leaveFromActor(id, actor)
      actor.removeCaller(caller)
      debug(`Leave caller "${caller.key}" from actor "${key}"`)
      logger.info(`Leave caller "${caller.key}" from actor "${key}"`)
      yield actorService.save(actor)
      actorIO.to(actor.socketId).emit(LEAVE, callerInfo(caller, messages))

      return [ {
        key: actor.key,
        as: caller.key
      } ]
    }))

    // Handle fire request from caller
    socket.on(PERFORM, s.ack(function * handlePerform (data = {}) {
      let pid = uuid.v4()
      let { key } = data
      debug('Perform on actor:', key)
      if (!key) {
        throw new Error('[SUGO-Hub][PERFORM] key is required.')
      }
      let actor = yield actorService.find(key, { strict: true })
      let caller = yield callerService.findBySocketId(id)
      yield invocationService.beginInvocation(pid, caller)
      process.nextTick(() =>
        actorIO.to(actor.socketId).emit(PERFORM, Object.assign({}, data, { pid }))
      )

      return [ {
        key: actor.key,
        as: caller.key,
        pid: pid
      } ]
    }))

    // Handle pipe from caller to actor
    socket.on(PIPE, (data) =>
      co(function * handlePipe () {
        let { key } = data
        if (!key) {
          throw new Error('[SUGO-Hub][PIPE] key is required.')
        }
        let actor = yield actorService.find(key, { strict: true })
        actorIO.to(actor.socketId).emit(PIPE, data)
      }).catch((err) => s.handleError(err))
    )

    // Cleanup sockets
    socket.on(DISCONNECT, () => co(function * handleDisconnect () {
      let caller = yield callerService.findBySocketId(id)
      if (!caller) {
        return
      }
      if (caller.actors) {
        for (let key of caller.actors) {
          let actor = yield actorService.find(key)
          if (actor) {
            actor.removeCaller(caller)
            yield actorService.save(actor)
          }
        }
      }
      let invocations = yield invocationService.findInvocationsForCaller(caller.key)
      for (let invocation of invocations) {
        yield invocation.finishInvocation(invocation.pid)
      }
      yield callerService.destroy(caller.key)
    }))
  }
}

module.exports = CallerConnector
