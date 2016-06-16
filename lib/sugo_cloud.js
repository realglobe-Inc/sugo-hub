/**
 * @function sugoCloud
 * @param {Object} [options] - Optional settings
 * @param {string|Object} [options.storage] -  Storage options
 * @returns {Promise.<Object>}
 */
'use strict'

const co = require('co')
const sgSocket = require('sg-socket')
const debug = require('debug')('sg:cloud')
const newStorage = require('./helpers/new_storage')

const { SpotNamespace, TerminalNamespace } = require('./namespaces')
const { SpotService, TerminalService } = require('./services')

const { ReservedEvents } = require('sg-socket-constants')

const { CONNECTION, DISCONNECT } = ReservedEvents
const { SPOT_URL, TERMINAL_URL } = require('./constatns/url_constants')

/** @lends sugoCloud */
function sugoCloud (options = {}) {
  let { server, port } = options

  if (server) {
    server.listen(port)
  }

  let wsServer = sgSocket(server || port)
  let { httpServer } = wsServer

  let storage = newStorage(options.storage || 'var/sugos/cloud')

  let spotService = new SpotService(storage)
  let terminalService = new TerminalService(storage)

  let spotSockets = {}
  let terminalSockets = {}

  let spotNamespace = new SpotNamespace({})
  let terminalNamespace = new TerminalNamespace({})

  return co(function * () {
    let scope = {
      spotService,
      terminalService,
      terminalSockets,
      spotSockets
    }
    // Handle SUGO-Spot connections
    wsServer.of(SPOT_URL)
      .on(CONNECTION, (socket) => spotNamespace.handleConnection(socket, scope))

    // Handle SUGO-Terminal connections
    wsServer.of(TERMINAL_URL)
      .on(CONNECTION, (socket) => terminalNamespace.handleConnection(socket, scope))

    Object.assign(httpServer, {
      port: httpServer.address().port,
      close: ((close) => function decoratedClose () {
        const CLOSE_DELAY = 100 // Wait for flush
        return co(function * () {
          yield new Promise((resolve) =>
            close.call(httpServer, () => {
              setTimeout(() => resolve(), CLOSE_DELAY)
            }))
          return httpServer
        })
      })(httpServer.close),
      /**
       * Set spot tokens
       * @param {Object} tokens
       */
      registerSpotTokens (tokens) {
        return co(function * () {
          for (let key of Object.keys(tokens)) {
            yield spotService.registerToken(key, tokens[ key ])
          }
          return httpServer
        })
      },

      /**
       * Destroy a spot
       * @param {string} key - Key of spot
       * @returns {Promise}
       */
      destroySpot (key) {
        return co(function * () {
          yield spotService.destroy(key)
        })
      }
    })

    return httpServer
  })
}

Object.assign(sugoCloud, {
  newStorage
})

module.exports = sugoCloud
