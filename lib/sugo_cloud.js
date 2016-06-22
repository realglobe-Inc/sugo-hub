/**
 * @function sugoCloud
 * @param {Object} [options] - Optional settings
 * @param {string|Object} [options.storage] -  Storage options
 * @param {string} [config.keys] - Koa keys
 * @param {Object} [options.endpoints] - Endpoint settings
 * @param {Object} [config.context] - Koa context prototype
 * @param {string} [config.public] - Public directories.
 * @param {number} [options.port=3000] - Port number
 * @returns {Promise.<Object>}
 */
'use strict'

const co = require('co')
const sgSocket = require('sg-socket')
const sgServer = require('sg-server')
const debug = require('debug')('sg:cloud')
const newStorage = require('./helpers/new_storage')

const { SocketPool } = require('./pools')
const { SpotNamespace, TerminalNamespace, ObserverNamespace } = require('./namespaces')
const { SpotService, TerminalService, ObserverService } = require('./services')
const { SpotEndpoint, TerminalEndpoint } = require('./endpoints')

const { ReservedEvents } = require('sg-socket-constants')

const { CONNECTION } = ReservedEvents
const { SPOT_URL, TERMINAL_URL, OBSERVER_URL } = require('./constatns/url_constants')

/** @lends sugoCloud */
function sugoCloud (options = {}) {
  let { port, endpoints, middlewares, context, keys } = options
  port = port || 3000
  let server = sgServer({
    endpoints,
    middlewares,
    context,
    keys,
    public: options.public
  })
  server.listen(port)
  let wsServer = sgSocket(server || port)
  let instance = wsServer.httpServer

  let storage = newStorage(options.storage || 'var/sugos/cloud')

  let spotService = new SpotService(storage)
  let terminalService = new TerminalService(storage)
  let observerService = new ObserverService(storage)

  let spotSockets = new SocketPool({})
  let terminalSockets = new SocketPool({})
  let observerSockets = new SocketPool({})

  let spotNamespace = new SpotNamespace({})
  let terminalNamespace = new TerminalNamespace({})
  let observerNamespace = new ObserverNamespace({})

  return co(function * () {
    let scope = {
      spotService,
      terminalService,
      observerService,
      spotSockets,
      terminalSockets,
      observerSockets
    }

    let spotEndpoint = new SpotEndpoint(scope)
    let terminalEndpoint = new TerminalEndpoint(scope)

    server.addEndpoints({
      [SPOT_URL]: { GET: spotEndpoint.list() },
      [TERMINAL_URL]: { GET: terminalEndpoint.list() }
    })

    // Handle SUGO-Spot connections
    wsServer.of(SPOT_URL)
      .on(CONNECTION, (socket) => spotNamespace.handleConnection(socket, scope))

    // Handle SUGO-Terminal connections
    wsServer.of(TERMINAL_URL)
      .on(CONNECTION, (socket) => terminalNamespace.handleConnection(socket, scope))

    // Handle SUGO-Observer connections
    wsServer.of(OBSERVER_URL)
      .on(CONNECTION, (socket) => observerNamespace.handleConnection(socket, scope))

    Object.assign(instance, {
      spotService,
      terminalService,
      observerService,
      /**
       * Invalidate spots.
       * Spots may be failed to cleanup when cloud spot suddenly killed.
       * @returns {Promise}
       */
      invalidateSpots () {
        return co(function * () {
          let { sockets } = wsServer.of(SPOT_URL).clients()
          let spots = yield spotService.info()
          for (let spot of spots) {
            let { socketId, key } = spot
            let socket = sockets[ socketId ]
            if (!socket) {
              yield spotService.destroy(key)
              delete spotSockets[ key ]
              debug(`Invalided invalid spot: ${key} (socket: ${socketId})`)
            }
          }
        })
      }
    })

    yield instance.invalidateSpots()
    
    return instance
  })
}

Object.assign(sugoCloud, {
  newStorage
})

module.exports = sugoCloud
