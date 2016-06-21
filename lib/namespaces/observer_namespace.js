/**
 * Namespace for observer
 * @class ObserverNamespace
 */
'use strict'

const co = require('co')
const Namespace = require('./namespace')

const { ReservedEvents, ObservingEvents } = require('sg-socket-constants')
const { START, STOP, CHANGE } = ObservingEvents
const { DISCONNECT } = ReservedEvents

const { SpotEvents, TerminalEvents } = require('../events')
const { SETUP, UPDATE, TEARDOWN } = SpotEvents
const { JOIN, LEAVE } = TerminalEvents

const debug = require('debug')('sg:cloud:observer')

/** @lends ObserverNamespace */
class ObserverNamespace extends Namespace {
  constructor (options) {
    super()
    const s = this
  }

  /**
   * @override
   */
  handleConnection (socket, scope) {
    const s = this

    let { observerSockets, observerService, spotService, terminalService } = scope

    let { socketPipe, registerListeners, deregisterListeners } = ObserverNamespace

    let { id } = socket

    let spotListeners = socketPipe(socket, [ SETUP, UPDATE, TEARDOWN ])
    let terminalListeners = socketPipe(socket, [ JOIN, LEAVE ])

    // Handle connect request form observer
    socket.on(START, s.ack(function * startObserving (data) {
      let observer = yield observerService.startObserving(id)

      debug(`Start observing on socket: ${observer.socketId}`)
      observerSockets[ observer.key ] = socket

      registerListeners(spotService, spotListeners)
      registerListeners(terminalService, terminalListeners)

      return { key: observer.key }
    }))

    // Handle disconnect request from observer
    socket.on(STOP, s.ack(function * teardownSpot (data) {
      let observer = yield observerService.stopObserving(id)

      debug(`Stop observing on socket: ${observer.socketId}`)

      deregisterListeners(spotService, spotListeners)
      deregisterListeners(terminalService, terminalListeners)

      return { key: observer.key }
    }))

    // Cleanup sockets
    socket.on(DISCONNECT, () => co(function * cleanup () {
      let observer = observerService.findBySocketId(id)
      observerService.destroy(observer.key)
      delete observerSockets[ observer.key ]
    }))
  }
}

Object.assign(ObserverNamespace, {
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

module.exports = ObserverNamespace
