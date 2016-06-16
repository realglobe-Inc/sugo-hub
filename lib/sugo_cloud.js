/**
 * @function sugoCloud
 * @param {Object} [options] - Optional settings
 * @param {string|Object} [options.storage] -  Storage options
 * @param {number} [options.port=3000] - Port number
 * @returns {Promise.<Object>}
 */
'use strict'

const co = require('co')
const sgSocket = require('sg-socket')
const sgServer = require('sg-server')
const debug = require('debug')('sg:cloud')
const newStorage = require('./helpers/new_storage')

const { SpotNamespace, TerminalNamespace } = require('./namespaces')
const { SpotService, TerminalService } = require('./services')

const { ReservedEvents } = require('sg-socket-constants')

const { CONNECTION } = ReservedEvents
const { SPOT_URL, TERMINAL_URL } = require('./constatns/url_constants')

/** @lends sugoCloud */
function sugoCloud (options = {}) {
  let { port, middlewares, routes } = options
  port = port || 3000
  let server = sgServer({
    middlewares,
    routes,
    public: options.public
  })
  server.listen(port)
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
