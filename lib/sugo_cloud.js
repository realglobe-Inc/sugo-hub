/**
 * @function sugoCloud
 * @param {Object} [options] - Optional settings
 */
'use strict'

const co = require('co')
const sgSocket = require('sg-socket')
const sgStorage = require('sg-storage')

const { SpotConnector, TerminalConnector } = require('./connectors')

const { GreetingEvents, RemoteEvents, ReservedEvents } = require('sg-socket-constants')
const { HI, BYE } = GreetingEvents
const { INTERFACE, ACTION, PIPE, JOIN, LEAVE } = RemoteEvents
const { CONNECTION } = ReservedEvents

/** @lends sugoCloud */
function sugoCloud (options = {}) {
  let wsServer = sgSocket(options.port)
  let { httpServer } = wsServer

  // TODO Use redis
  let storage = sgStorage(options.storage || 'var/sugos/cloud')
  let spots = new SpotConnector(storage)
  let terminals = new TerminalConnector(storage)
 
  return co(function * () {
    
    // Handle SUGO-Spot connections
    wsServer.of('/spots').on(CONNECTION, (socket) => {
      socket.on(HI, (data, callback) => spots.handleHi(socket, data, callback))
      socket.on(BYE, (data, callback) => spots.handleBye(socket, data, callback))
      socket.on(INTERFACE, (data, callback) => {})
      socket.on(PIPE, (data, callback) => {})
    })

    // Handle SUGO-Terminal connections
    wsServer.of('/terminals').on(CONNECTION, (socket) => {
      socket.on(ACTION, (data, callback) => {})
      socket.on(JOIN, (data, callback) => {})
      socket.on(LEAVE, (data, callback) => {})
    })

    httpServer.close = ((close) => function decoratedClose () {
      return new Promise((resolve) => close.call(httpServer, () => resolve()))
    })(httpServer.close)
    return httpServer
  })
}

Object.assign(sugoCloud, {})

module.exports = sugoCloud
