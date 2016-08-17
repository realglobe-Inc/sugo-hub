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

    // Handle join request from caller
    socket.on(JOIN, s.ack(function * joinToActor (data) {
      let actor = yield actorService.find(data.key, { strict: true })
      let caller = yield callerService.joinToActor(id, actor)
      callerSockets[ caller.key ] = socket
      actor.addCaller(caller)
      debug(`Join caller "${caller.key}" to actor "${actor.key}"`)
      yield actorService.save(actor)
      return [ { key: actor.key, specs: actor.$specs } ]
    }))

    // Handle leave request from caller
    socket.on(LEAVE, s.ack(function * leaveSpot (data) {
      let actor = yield actorService.find(data.key, { strict: true })
      let caller = yield callerService.leaveFromActor(id, actor)
      delete callerSockets[ caller.key ]
      actor.removeCaller(caller)
      debug(`Leave caller "${caller.key}" from actor "${actor.key}"`)
      yield actorService.save(actor)
      return [ { key: actor.key } ]
    }))

    // Handle fire request from caller
    socket.on(PERFORM, s.ack(function * performOnActor (data) {
      let { key } = data
      debug('Perform on actor:', key)
      if (!key) {
        throw new Error('key is required.')
      }
      let actor = yield actorService.find(key, { strict: true })
      let socket = actorSockets[ actor.key ]
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
        let socket = actorSockets[ actor.key ]
        socket.emit(PIPE, data)
      }).catch((err) => s.handleError(err))
    })

    // Cleanup sockets
    socket.on(DISCONNECT, () => co(function * cleanup () {
      let caller = callerService.findBySocketId(id)
      if (!caller) {
        return
      }
      for (let key of caller.actors) {
        let actor = yield actorService.find(key)
        if (actor) {
          actor.removeCaller(caller)
          yield actorService.save(actor)
        }
      }
      yield callerService.destroy(caller.key)
      delete callerSockets[ caller.key ]
    }))
  }
}

module.exports = CallerNamespace
