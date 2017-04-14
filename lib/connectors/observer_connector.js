/**
 * Connector for observers
 * @augments Connector
 * @class ObserverConnector
 */
'use strict'

const co = require('co')
const Connector = require('./connector')

const { ReservedEvents, ObservingEvents } = require('sg-socket-constants')
const { START, STOP, CHANGE } = ObservingEvents
const { DISCONNECT } = ReservedEvents

const { ActorEvents, CallerEvents } = require('sugo-constants')
const { SETUP, UPDATE, TEARDOWN } = ActorEvents
const { JOIN, LEAVE } = CallerEvents

const debug = require('debug')('sg:hub:observer')

/** @lends ObserverConnector */
class ObserverConnector extends Connector {

  /**
   * @override
   */
  handleConnection (socket, scope) {
    const s = this

    let {
      observerService,
      actorService,
      callerService } = scope

    let { socketPipe, registerListeners, deregisterListeners } = ObserverConnector

    let { id } = socket

    let actorListeners = socketPipe(socket, [ SETUP, UPDATE, TEARDOWN ])
    let callerListeners = socketPipe(socket, [ JOIN, LEAVE ])

    // Handle connect request form observer
    socket.on(START, s.ack(function * startObserving (data) {
      let observer = yield observerService.startObserving(id)

      debug(`Start observing on socket: ${observer.socketId}`)

      registerListeners(actorService, actorListeners)
      registerListeners(callerService, callerListeners)

      return [{ key: observer.key }]
    }))

    // Handle disconnect request from observer
    socket.on(STOP, s.ack(function * teardownActor (data) {
      let observer = yield observerService.stopObserving(id)

      debug(`Stop observing on socket: ${observer.socketId}`)

      deregisterListeners(actorService, actorListeners)
      deregisterListeners(callerService, callerListeners)

      return [{ key: observer.key }]
    }))

    // Cleanup sockets
    socket.on(DISCONNECT, () => co(function * cleanup () {
      let observer = observerService.findBySocketId(id)
      observerService.destroy(observer.key)
    }))
  }
}

Object.assign(ObserverConnector, {
  socketPipe (socket, events) {
    let handlers = {}
    for (let event of events) {
      handlers[ event ] = (data) => socket.emit(CHANGE, { event, data })
    }
    return handlers
  },
  registerListeners (emitter, listeners) {
    for (let event of Object.keys(listeners)) {
      emitter.addListener(event, listeners[ event ])
    }
  },
  deregisterListeners (emitter, listeners) {
    for (let event of Object.keys(listeners)) {
      emitter.removeListener(event, listeners[ event ])
    }
  }

})

module.exports = ObserverConnector
