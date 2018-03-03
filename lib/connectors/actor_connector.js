/**
 * Connector for actor
 * @augments Connector
 * @class ActorConnector
 */
'use strict'

const Connector = require('./connector')
const {HubNotices} = require('sugo-constants')
const {GreetingEvents, RemoteEvents, ReservedEvents} = require('sg-socket-constants')
const {SPEC, DESPEC, PIPE, PURGE, RESULT, ERROR, NOTICE} = RemoteEvents
const {HI, BYE} = GreetingEvents
const {DISCONNECT} = ReservedEvents
const {ACTOR_GONE} = HubNotices

const {ng} = Connector.helpers

const debug = require('debug')('sg:hub:actor')

const actorGoneInvocationError = (invocation, actor) => Object.assign(ng({
  name: 'ActorGone',
  message: `Failed to invoke method because actor "${actor.key} is gone`
}), {
  pid: invocation.pid,
  key: actor.key
})

const ActorErrors = {
  RESULT_REJECTED: 'ResultRejected',
  INVOCATION_NOT_FOUND: 'InvocationNotFound'
}

/** @lends ActorConnector */
class ActorConnector extends Connector {
  /**
   * @override
   */
  handleConnection (socket, scope) {
    const {logger} = this
    const {
      actorService,
      callerService,
      invocationService,
      callerIO,
      actorIO
    } = scope
    const {id} = socket

    const roomNameForActor = (actor) => `actor#${actor.key}`
    const joinToRoom = (roomName) => new Promise((resolve) =>
      socket.join(roomName, resolve)
    )
    const leaveFromRoom = (roomName) => new Promise((resolve) =>
      socket.leave(roomName, resolve)
    )

    const broadcastToCallers = async (callerKeys, event, data) => {
      for (const key of callerKeys) {
        const caller = await callerService.find(key)
        if (!caller) {
          continue
        }
        callerIO.to(caller.socketId).emit(event, data)
      }
    }

    // Handle connect request form actor
    socket.on(HI, this.ack(async (data = {}) => {
      let {key, force} = data
      let actor = await actorService.setupActor(id, key, {force})
      let roomName = roomNameForActor(actor)
      await joinToRoom(roomName)
      if (force) {
        actorIO.to(actor.socketId).emit(PURGE)
      }
      debug(`Setup an actor on socket: ${actor.socketId}`)
      logger.info(`Setup an actor on socket: ${actor.socketId}`)
      return [{key: actor.key}]
    }))

    // Handle disconnect request from actor
    socket.on(BYE, this.ack(async (data = {}) => {
      let {key} = data
      let actor = await actorService.teardownActor(id, key)
      let roomName = roomNameForActor(actor)
      await leaveFromRoom(roomName)
      debug(`Teardown an actor on socket: ${actor.socketId}`)
      logger.info(`Teardown an actor on socket: ${actor.socketId}`)
      return [{key: actor.key}]
    }))

    // Handle spec notice from actor
    socket.on(SPEC, this.ack(async (data = {}) => {
      let {name, spec} = data
      if (!name) {
        throw new Error('[SUGO-Hub][SPEC] name is required')
      }
      let actor = await actorService.updateSpec(id, name, spec)
      debug(`Update actor spec on socket: ${actor.socketId}`)

      broadcastToCallers(actor.callers, SPEC, data)

      return [{key: actor.key}]
    }))

    // Handle despec notice from actor
    socket.on(DESPEC, this.ack(async (data = {}) => {
      let {name} = data
      if (!name) {
        throw new Error('[SUGO-Hub][DESPEC] name is required')
      }
      let actor = await actorService.delSpec(id, name)
      debug(`Delete actor spec on socket: ${actor.socketId}`)

      broadcastToCallers(actor.callers, DESPEC, data)

      return [{key: actor.key}]
    }))

    // Handle perform result
    socket.on(RESULT, async (data) => {
      let {pid} = data
      if (!pid) {
        socket.emit(ERROR, {
          name: ActorErrors.RESULT_REJECTED,
          data: {
            reason: 'pid missing'
          }
        })
        return
      }
      let invocation
      try {
        invocation = await invocationService.findInvocation(pid)
        if (!invocation) {
          console.warn(`[SUGO-Hub] Invocation not found for pid: ${pid}`)
          socket.emit(ERROR, {
            name: ActorErrors.INVOCATION_NOT_FOUND,
            data: {
              pid
            }
          })
          return
        }
        await invocationService.finishInvocation(pid)
      } catch (err) {
        this.handleError(err)
      }

      process.nextTick(() =>
        callerIO.to(invocation.callerSocket).emit(RESULT, data)
      )
    })

    // Handle pipe from actor to terminal
    // This does not ack back for performance reason
    socket.on(PIPE, async (data) => {
      let {key, only = null} = data
      only = only && [].concat(only)
      const actor = await actorService.find(key, {strict: true})
      try {
        for (const key of actor.callers) {
          const caller = await callerService.find(key)
          if (!caller) {
            continue
          }
          const skip = only && !~only.indexOf(caller.key)
          if (skip) {
            continue
          }
          callerIO.to(caller.socketId).emit(PIPE, data)
        }
      } catch (err) {
        this.handleError(err)
      }
    })

    socket.on(DISCONNECT, async () => {
      debug('Actor socket disconnected:', id)
      let actor = await actorService.findBySocketId(id)
      if (!actor) {
        return
      }
      if (actor.callers) {
        for (const callerKey of actor.callers) {
          const caller = await callerService.find(callerKey)
          if (caller) {
            callerIO.to(caller.socketId).emit(NOTICE, {
              name: ACTOR_GONE,
              data: {
                key: actor.key,
                at: new Date()
              }
            })
            let invocations = await invocationService.findInvocationsForCaller(caller.key)
            for (let invocation of invocations) {
              await invocationService.finishInvocation(invocation.pid)
              let result = actorGoneInvocationError(invocation, actor)
              process.nextTick(() =>
                callerIO.to(invocation.callerSocket).emit(RESULT, result)
              )
            }
          }
        }
      }
      await actorService.destroy(actor.key)
    })
  }
}

module.exports = ActorConnector
