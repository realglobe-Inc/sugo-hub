/**
 * Connector for caller
 * @augments Connector
 * @class CallerConnector
 */
'use strict'

const Connector = require('./connector')
const {HubNotices} = require('sugo-constants')
const {RemoteEvents, ReservedEvents} = require('sg-socket-constants')
const {PIPE, JOIN, LEAVE, PERFORM, NOTICE} = RemoteEvents
const {CALLER_GONE} = HubNotices
const {DISCONNECT} = ReservedEvents
const uuid = require('uuid')
const debug = require('debug')('sg:hub:caller')

/** @lends CallerConnector */
class CallerConnector extends Connector {
  /**
   * @override
   */
  handleConnection (socket, scope) {
    const s = this
    const {logger} = s
    const {
      actorService,
      callerService,
      invocationService,
      actorIO
    } = scope
    const {id} = socket

    const callerInfo = (caller, messages) => ({
      caller: {
        key: caller.key
      },
      messages
    })

    // Handle join request from caller
    socket.on(JOIN, s.ack(async function handleJoin (data = {}) {
      const {key, messages} = data

      const actor = await actorService.find(key, {strict: true})
      const caller = await callerService.joinToActor(id, actor)

      if (!actor) {
        throw new Error(`[SUGO-Hub][JOIN] actor not found for key: ${key}`)
      }
      actor.addCaller(caller)
      debug(`Join caller "${caller.key}" to actor "${key}"`)
      logger.info(`Join caller "${caller.key}" to actor "${key}"`)
      await actorService.save(actor)
      actorIO.to(actor.socketId).emit(JOIN, callerInfo(caller, messages))

      return [{
        key: actor.key,
        specs: actor.$specs,
        as: caller.key
      }]
    }))

    // Handle leave request from caller
    socket.on(LEAVE, s.ack(async function handleLeave (data = {}) {
      const {key, messages} = data
      const actor = await actorService.find(key, {strict: false})
      if (!actor) {
        debug(`Skip leaving caller from actor "${key}" since actor already gone.`)
        return []
      }
      const caller = await callerService.leaveFromActor(id, actor)
      actor.removeCaller(caller)
      debug(`Leave caller "${caller.key}" from actor "${key}"`)
      logger.info(`Leave caller "${caller.key}" from actor "${key}"`)
      await actorService.save(actor)
      actorIO.to(actor.socketId).emit(LEAVE, callerInfo(caller, messages))

      return [{
        key: actor.key,
        as: caller.key
      }]
    }))

    // Handle fire request from caller
    socket.on(PERFORM, s.ack(async function handlePerform (data = {}) {
      const pid = uuid.v4()
      const {key} = data
      debug('Perform on actor:', key)
      if (!key) {
        throw new Error('[SUGO-Hub][PERFORM] key is required.')
      }
      const actor = await actorService.find(key, {strict: true})
      const caller = await callerService.findBySocketId(id)
      if (!caller) {
        throw new Error(`[SUGO-Hub][PERFORM] Caller gone from actor "${key}`)
      }
      await invocationService.beginInvocation(pid, caller)
      process.nextTick(() =>
        actorIO.to(actor.socketId).emit(PERFORM, Object.assign({}, data, {pid}, callerInfo(caller)))
      )

      return [{
        key: actor.key,
        as: caller.key,
        pid: pid
      }]
    }))

    // Handle pipe from caller to actor
    socket.on(PIPE, async (data) => {
      const {key} = data
      if (!key) {
        throw new Error('[SUGO-Hub][PIPE] key is required.')
      }
      try {
        const actor = await actorService.find(key, {strict: true})
        actorIO.to(actor.socketId).emit(PIPE, data)
      } catch (err) {
        s.handleError(err)
      }
    })

    // Cleanup sockets
    socket.on(DISCONNECT, async () => {
      const caller = await callerService.findBySocketId(id)
      if (!caller) {
        return
      }
      if (caller.actors) {
        for (const actorKey of caller.actors) {
          const actor = await actorService.find(actorKey)
          if (actor) {
            actor.removeCaller(caller)
            await actorService.save(actor)
            actorIO.to(actor.socketId).emit(NOTICE, {
              name: CALLER_GONE,
              data: {
                key: caller.key,
                at: new Date()
              }
            })
          }
        }
      }
      const invocations = await invocationService.findInvocationsForCaller(caller.key)
      for (const invocation of invocations) {
        await invocationService.finishInvocation(invocation.pid)
      }
      await callerService.destroy(caller.key)
    })
  }
}

module.exports = CallerConnector
