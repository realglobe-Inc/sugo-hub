/**
 * Connector for actor
 * @augments Connector
 * @class ActorConnector
 */
'use strict'

const co = require('co')
const Connector = require('./connector')

const { GreetingEvents, RemoteEvents, ReservedEvents } = require('sg-socket-constants')
const { SPEC, DESPEC, PIPE, PURGE, RESULT } = RemoteEvents
const { HI, BYE } = GreetingEvents
const { DISCONNECT } = ReservedEvents

const debug = require('debug')('sg:hub:actor')

/** @lends ActorConnector */
class ActorConnector extends Connector {

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
      callerIO,
      actorIO
    } = scope
    let { id } = socket

    let roomNameForActor = (actor) => `actor#${actor.key}`
    let joinToRoom = (roomName) => new Promise((resolve) =>
      socket.join(roomName, resolve)
    )
    let leaveFromRoom = (roomName) => new Promise((resolve) =>
      socket.leave(roomName, resolve)
    )

    let broadcastToCallers = (callerKeys, event, data) => co(function * () {
      for (let key of callerKeys) {
        let caller = yield callerService.find(key)
        if (!caller) {
          continue
        }
        callerIO.to(caller.socketId).emit(event, data)
      }
    })

    // Handle connect request form actor
    socket.on(HI, s.ack(function * handleHi (data = {}) {
      let { key, force } = data
      let actor = yield actorService.setupActor(id, key, { force })
      let roomName = roomNameForActor(actor)
      yield joinToRoom(roomName)
      if (force) {
        actorIO.to(actor.socketId).emit(PURGE)
      }
      debug(`Setup an actor on socket: ${actor.socketId}`)
      logger.info(`Setup an actor on socket: ${actor.socketId}`)
      return [ { key: actor.key } ]
    }))

    // Handle disconnect request from actor
    socket.on(BYE, s.ack(function * handleBye (data = {}) {
      let { key } = data
      let actor = yield actorService.teardownActor(id, key)
      let roomName = roomNameForActor(actor)
      yield leaveFromRoom(roomName)
      debug(`Teardown an actor on socket: ${actor.socketId}`)
      logger.info(`Teardown an actor on socket: ${actor.socketId}`)
      return [ { key: actor.key } ]
    }))

    // Handle spec notice from actor
    socket.on(SPEC, s.ack(function * handleSpec (data = {}) {
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
    socket.on(DESPEC, s.ack(function * handleDespec (data = {}) {
      let { name } = data
      if (!name) {
        throw new Error('[SUGO-Hub][DESPEC] name is required')
      }
      let actor = yield actorService.delSpec(id, name)
      debug(`Delete actor spec on socket: ${actor.socketId}`)

      broadcastToCallers(actor.callers, DESPEC, data)

      return [ { key: actor.key } ]
    }))

    // Handle perform result
    socket.on(RESULT, (data) =>
      co(function * handleResult () {
        let { pid } = data
        if (!pid) {
          // TODO Notice error to the actor
          return
        }
        let invocation = yield invocationService.findInvocation(pid)
        if (!invocation) {
          console.warn(`[SUGO-Hub] invocation not found for pid: ${pid}`)
          // TODO Notice error to the actor
          return
        }
        process.nextTick(() =>
          callerIO.to(invocation.callerSocket).emit(RESULT, data)
        )
      }).catch((err) => s.handleError(err))
    )

    // Handle pipe from actor to terminal
    // This does not ack back for performance reason
    socket.on(PIPE, (data) =>
      co(function * handlePipe () {
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
          callerIO.to(caller.socketId).emit(PIPE, data)
        }
      }).catch((err) => s.handleError(err))
    )

    socket.on(DISCONNECT, () =>
      co(function * handleDisconnect () {
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
      })
    )
  }
}

module.exports = ActorConnector
