/**
 * Namespace for observer
 * @class ObserverNamespace
 */
'use strict'

const co = require('co')
const Namespace = require('./namespace')

const { GreetingEvents, RemoteEvents } = require('sg-socket-constants')
const { NOTICE } = RemoteEvents
const { HI, BYE } = GreetingEvents

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

    let { observerSockets, observerService } = scope

    let { id } = socket

    // Handle connect request form observer
    socket.on(HI, s.ack(function * startObserving (data) {
      let observer = yield observerService.startObserving(id)

      debug(`Start observing on socket: ${observer.socketId}`)
      return { key: observer.key }
    }))

    // Handle disconnect request from observer
    socket.on(BYE, s.ack(function * teardownSpot (data) {
      let observer = yield observerService.stopObserving(id)
      
      debug(`Stop observing on socket: ${observer.socketId}`)
      return { key: observer.key }
    }))
  }
}

module.exports = ObserverNamespace
