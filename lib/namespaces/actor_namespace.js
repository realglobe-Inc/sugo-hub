/**
 * Namespace for actor
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
  constructor (options = {}) {
    super()
    const s = this
  }

  /**
   * @override
   */
  handleConnection (socket, scope) {
    const s = this

    let { actorService, callerService, callerSockets, actorSockets } = scope
    let { id } = socket

    let broadcastToCallers = (callerKeys, event, data) => {
      for (let key of callerKeys) {
        let socket = callerSockets[ key ]
        if (socket) {
          socket.emit(event, data)
        }
      }
    }

    // Handle connect request form actor
    socket.on(HI, s.ack(function * setupActor (data) {
      let { key, force } = data
      let actor = yield actorService.setupActor(id, key, { force })
      if (force) {
        s.killSocket(actorSockets[ key ])
      }
      debug(`Setup an actor on socket: ${actor.socketId}`)
      actorSockets[ key ] = socket
      return [ { key: actor.key } ]
    }))

    // Handle disconnect request from actor
    socket.on(BYE, s.ack(function * teardownActor (data) {
      let { key } = data
      let actor = yield actorService.teardownActor(id, key)
      debug(`Teardown an actor on socket: ${actor.socketId}`)
      delete actorSockets[ key ]
      return [ { key: actor.key } ]
    }))

    // Handle spec notice from actor
    socket.on(SPEC, s.ack(function * updateSpec (data) {
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
    socket.on(DESPEC, s.ack(function * delSpec (data) {
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
        let { key } = data
        let actor = yield actorService.find(key, { strict: true })
        for (let key of actor.callers) {
          let socket = callerSockets[ key ]
          if (socket) {
            socket.emit(PIPE, data)
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
      for (let key of actor.callers) {
        let caller = yield actorService.find(key)
        if (caller) {
          // TODO notice actor lost
        }
      }
      yield actorService.destroy(actor.key)
      delete actorSockets[ actor.key ]
    }))
  }
}

module.exports = ActorNamespace
