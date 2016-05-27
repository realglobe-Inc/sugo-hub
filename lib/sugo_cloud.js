/**
 * @function sugoCloud
 * @param {Object} [options] - Optional settings
 */
'use strict'

const co = require('co')
const sgSocket = require('sg-socket')
const sgStorage = require('sg-storage')
const SpotConnector = require('./connectors/spot_connector')
const { SpotEvents } = require('sg-socket-constants')

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
        let { HI, BYE, ABOUT } = SpotEvents
        socket.on(HI, (data) => spots.handleHi(socket, data))
        socket.on(BYE, (data) => spots.handleBye(socket, data))
        socket.on(ABOUT, (data) => spots.handleAbout(socket, data))
      }
    })
    httpServer.close = ((close) => function decoratedClose () {
      return new Promise((resolve) => close.call(httpServer, () => resolve()))
    })(httpServer.close)
    return httpServer
  })
}

Object.assign(sugoCloud, {
  SpotEvents
})

module.exports = sugoCloud
