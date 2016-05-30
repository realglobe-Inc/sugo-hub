/**
 * @function sugoCloud
 * @param {Object} [options] - Optional settings
 */
'use strict'

const co = require('co')
const sgSocket = require('sg-socket')
const sgStorage = require('sg-storage')
const SpotConnector = require('./connectors/spot_connector')
const { GreetingEvents } = require('sg-socket-constants')

/** @lends sugoCloud */
function sugoCloud (options = {}) {
  let wsServer = sgSocket(options.port)
  let { httpServer } = wsServer
  let storage = sgStorage(options.storage || 'var/sugos/cloud')
  let spots = new SpotConnector(storage)

  return co(function * () {
    yield spots.restore()

    wsServer.on('connection', (socket) => {
      // Handle spot events
      {
        const { HI, BYE } = GreetingEvents
        socket.on(HI, (data, callback) => spots.handleHi(socket, data, callback))
        socket.on(BYE, (data, callback) => spots.handleBye(socket, data, callback))
      }
    })
    httpServer.close = ((close) => function decoratedClose () {
      return new Promise((resolve) => close.call(httpServer, () => resolve()))
    })(httpServer.close)
    return httpServer
  })
}

Object.assign(sugoCloud, {})

module.exports = sugoCloud
