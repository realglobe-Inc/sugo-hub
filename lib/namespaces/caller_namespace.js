/**
 * Namespace for caller
 * @class CallerNamespace
 */
'use strict'

const co = require('co')
const Namespace = require('./namespace')

const { RemoteEvents, ReservedEvents, AcknowledgeStatus } = require('sg-socket-constants')
const { PIPE, JOIN, LEAVE, PERFORM } = RemoteEvents
const { OK, NG } = AcknowledgeStatus
const { DISCONNECT } = ReservedEvents

const debug = require('debug')('sg:hub:caller')

/** @lends CallerNamespace */
class CallerNamespace extends Namespace {

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

    const socketForActor = (actor) => actorIO.clients().sockets[ actor.socketId ]

    // Handle join request from caller
    socket.on(JOIN, s.ack(function * joinToActor (data = {}) {
      let actor = yield actorService.find(data.key, { strict: true })
      let caller = yield callerService.joinToActor(id, actor)

      // TODO check if actor socket is alive.

      actor.addCaller(caller)
      debug(`Join caller "${caller.key}" to actor "${actor.key}"`)
      logger.info(`Join caller "${caller.key}" to actor "${actor.key}"`)
      yield actorService.save(actor)
      return [ { key: actor.key, specs: actor.$specs } ]
    }))

    // Handle leave request from caller
    socket.on(LEAVE, s.ack(function * leaveActor (data = {}) {
      let actor = yield actorService.find(data.key, { strict: false })
      if (!actor) {
        debug(`Skip leaving caller from actor "${data.key}" since actor already gone.`)
        return []
      }
      let caller = yield callerService.leaveFromActor(id, actor)
      actor.removeCaller(caller)
      debug(`Leave caller "${caller.key}" from actor "${actor.key}"`)
      logger.info(`Leave caller "${caller.key}" from actor "${actor.key}"`)
      yield actorService.save(actor)
      return [ { key: actor.key } ]
    }))

    // Handle fire request from caller
    socket.on(PERFORM, s.ack(function * performOnActor (data = {}) {
      let { key } = data
      debug('Perform on actor:', key)
      if (!key) {
        throw new Error('key is required.')
      }
      let actor = yield actorService.find(key, { strict: true })
      let socket = socketForActor(actor)
      return yield new Promise((resolve, reject) =>
        socket.emit(PERFORM, data, (data) => {
          let { status, payload, meta } = data
          if (status === NG) {
            reject(payload && payload.message || payload)
            return
          }
          resolve([ payload, meta ])
        })
      )
    }))

    // Handle pipe from caller to caller
    socket.on(PIPE, (data) => {
      co(function * () {
        let { key } = data
        if (!key) {
          throw new Error('key is required.')
        }
        let actor = yield actorService.find(key, { strict: true })
        let socket = socketForActor(actor)
        socket.emit(PIPE, data)
      }).catch((err) => s.handleError(err))
    })

    // Cleanup sockets
    socket.on(DISCONNECT, () => co(function * cleanup () {
      let caller = callerService.findBySocketId(id)
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

module.exports = CallerNamespace
