/**
 * Connector for caller
 * @augments Connector
 * @class CallerConnector
 */
'use strict'

const co = require('co')
const Connector = require('./connector')

const { RemoteEvents, ReservedEvents, AcknowledgeStatus } = require('sg-socket-constants')
const { PIPE, JOIN, LEAVE, PERFORM } = RemoteEvents
const { OK, NG } = AcknowledgeStatus
const { DISCONNECT } = ReservedEvents

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
      actorIO
    } = scope
    let { id } = socket

    const socketForActor = (actor) => actorIO.connected[ actor.socketId ]

    const callerInfo = (caller, messages) => ({
      caller: {
        key: caller.key
      },
      messages
    })

    // Handle join request from caller
    socket.on(JOIN, s.ack(function * joinToActor (data = {}) {
      let { key, messages } = data
      let actor = yield actorService.find(key, { strict: true })
      let caller = yield callerService.joinToActor(id, actor)

      let actorSocket = actor && socketForActor(actor)
      if (!actorSocket) {
        throw new Error(`[SUGO-Hub][JOIN] actor not found for key: ${key}`)
      }

      actor.addCaller(caller)
      debug(`Join caller "${caller.key}" to actor "${key}"`)
      logger.info(`Join caller "${caller.key}" to actor "${key}"`)
      yield actorService.save(actor)
      actorSocket.emit(JOIN, callerInfo(caller, messages))

      return [ {
        key: actor.key,
        specs: actor.$specs,
        as: caller.key
      } ]
    }))

    // Handle leave request from caller
    socket.on(LEAVE, s.ack(function * leaveActor (data = {}) {
      let { key, messages } = data
      let actor = yield actorService.find(key, { strict: false })
      let actorSocket = actor && socketForActor(actor)
      if (!actorSocket) {
        debug(`Skip leaving caller from actor "${key}" since actor already gone.`)
        return []
      }
      let caller = yield callerService.leaveFromActor(id, actor)
      actor.removeCaller(caller)
      debug(`Leave caller "${caller.key}" from actor "${key}"`)
      logger.info(`Leave caller "${caller.key}" from actor "${key}"`)
      yield actorService.save(actor)
      actorSocket.emit(LEAVE, callerInfo(caller, messages))

      return [ {
        key: actor.key,
        as: caller.key
      } ]
    }))

    // Handle fire request from caller
    socket.on(PERFORM, s.ack(function * performOnActor (data = {}) {
      let { key } = data
      debug('Perform on actor:', key)
      if (!key) {
        throw new Error('[SUGO-Hub][PERFORM] key is required.')
      }
      let actor = yield actorService.find(key, { strict: true })
      let actorSocket = socketForActor(actor)
      return yield new Promise((resolve, reject) =>
        actorSocket.emit(PERFORM, data, (data) => {
          let { status, payload, meta } = data
          if (status === NG) {
            reject(payload && payload.message || payload)
            return
          }
          resolve([ payload, meta ])
        })
      )
    }))

    // Handle pipe from caller to actor
    socket.on(PIPE, (data) => {
      co(function * () {
        let { key } = data
        if (!key) {
          throw new Error('[SUGO-Hub][PIPE] key is required.')
        }
        let actor = yield actorService.find(key, { strict: true })
        let actorSocket = socketForActor(actor)
        actorSocket.emit(PIPE, data)
      }).catch((err) => s.handleError(err))
    })

    // Cleanup sockets
    socket.on(DISCONNECT, () => co(function * cleanup () {
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
      yield callerService.destroy(caller.key)
    }))
  }
}

module.exports = CallerConnector
