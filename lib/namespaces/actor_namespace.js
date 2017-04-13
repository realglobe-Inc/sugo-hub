/**
 * Namespace for actor
 * @augments Namespace
 * @class ActorNamespace
 */
'use strict'

const co = require('co')
const Namespace = require('./namespace')

const { GreetingEvents, RemoteEvents, ReservedEvents } = require('sg-socket-constants')
const { SPEC, DESPEC, PIPE } = RemoteEvents
const { HI, BYE } = GreetingEvents
const { DISCONNECT } = ReservedEvents

const debug = require('debug')('sg:hub:actor')

/** @lends ActorNamespace */
class ActorNamespace extends Namespace {

  /**
   * @override
   */
  handleConnection (socket, scope) {
    const s = this
    let { logger } = s
    let {
      actorService,
      callerService,
      callerIO,
      actorIO
    } = scope
    let { id } = socket

    let socketForCaller = (caller) => callerIO.clients().sockets[ caller.socketId ]

    let broadcastToCallers = (callerKeys, event, data) => co(function * () {
      for (let key of callerKeys) {
        let caller = yield callerService.find(key)
        if (!caller) {
          continue
        }
        let callerSocket = socketForCaller(caller)
        if (callerSocket) {
          callerSocket.emit(event, data)
        }
      }
    })

    // Handle connect request form actor
    socket.on(HI, s.ack(function * setupActor (data = {}) {
      let { key, force } = data
      let actor = yield actorService.setupActor(id, key, { force })
      if (force) {
        let socket = actorIO.clents().sockets[ actor.socketId ]
        s.killSocket(socket)
      }
      debug(`Setup an actor on socket: ${actor.socketId}`)
      logger.info(`Setup an actor on socket: ${actor.socketId}`)
      return [ { key: actor.key } ]
    }))

    // Handle disconnect request from actor
    socket.on(BYE, s.ack(function * teardownActor (data = {}) {
      let { key } = data
      let actor = yield actorService.teardownActor(id, key)
      debug(`Teardown an actor on socket: ${actor.socketId}`)
      logger.info(`Teardown an actor on socket: ${actor.socketId}`)
      return [ { key: actor.key } ]
    }))

    // Handle spec notice from actor
    socket.on(SPEC, s.ack(function * updateSpec (data = {}) {
      let { name, spec } = data
      if (!name) {
        throw new Error('[SUGO-Hub][SPEC] name is required')
      }
      let actor = yield actorService.updateSpec(id, name, spec)
      debug(`Update actor spec on socket: ${actor.socketId}`)

      broadcastToCallers(actor.callers, SPEC, data)

      return [ { key: actor.key } ]
    }))

    // Handle despec notice from actor
    socket.on(DESPEC, s.ack(function * delSpec (data = {}) {
      let { name } = data
      if (!name) {
        throw new Error('[SUGO-Hub][DESPEC] name is required')
      }
      let actor = yield actorService.delSpec(id, name)
      debug(`Delete actor spec on socket: ${actor.socketId}`)

      broadcastToCallers(actor.callers, DESPEC, data)

      return [ { key: actor.key } ]
    }))

    // Handle pipe from actor to terminal
    // This does not ack back for performance reason
    socket.on(PIPE, (data) => {
      co(function * () {
        let { key, only = null } = data
        only = only && [].concat(only)
        let actor = yield actorService.find(key, { strict: true })
        for (let key of actor.callers) {
          let caller = yield callerService.find(key)
          if (!caller) {
            continue
          }
          let skip = only && !~only.indexOf(caller.key)
          if (skip) {
            continue
          }
          let callerSocket = socketForCaller(caller)
          if (callerSocket) {
            callerSocket.emit(PIPE, data)
          }
        }
      }).catch((err) => s.handleError(err))
    })

    socket.on(DISCONNECT, () => co(function * cleanup () {
      debug('Disconnect:', id)
      let actor = yield actorService.findBySocketId(id)
      if (!actor) {
        return
      }
      if (actor.callers) {
        for (let key of actor.callers) {
          let caller = yield actorService.find(key)
          if (caller) {
            // TODO notice actor lost
          }
        }
      }
      yield actorService.destroy(actor.key)
    }))
  }
}

module.exports = ActorNamespace
