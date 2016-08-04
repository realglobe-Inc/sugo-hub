/**
 * @function sugoHub
 * @param {Object} [options] - Optional settings
 * @param {string|Object} [options.storage] -  Storage options
 * @param {string} [config.keys] - Koa keys
 * @param {Object} [options.endpoints] - Endpoint settings
 * @param {Object} [config.context] - Koa context prototype
 * @param {string} [config.public] - Public directories.
 * @param {number} [options.port=3000] - Port number
 * @param {number} [options.invalidateInterval=3000] - Interval for invalidate loop
 * @returns {Promise.<Object>}
 */
'use strict'

const co = require('co')
const sgSocket = require('sg-socket')
const sgServer = require('sg-server')
const debug = require('debug')('sg:hub')
const newStorage = require('./helpers/new_storage')

const { SocketPool } = require('./pools')
const { ActorNamespace, CallerNamespace, ObserverNamespace } = require('./namespaces')
const { ActorService, CallerService, ObserverService } = require('./services')
const { ActorEndpoint, CallerEndpoint } = require('./endpoints')

const { ReservedEvents } = require('sg-socket-constants')

const { CONNECTION } = ReservedEvents

const { HubUrls } = require('sugo-constants')
const { ACTOR_URL, CALLER_URL, OBSERVER_URL } = HubUrls

const MINIMUM_ALIVE_DURATION = 30 * 1000

/** @lends sugoHub */
function sugoHub (options = {}) {
  let { port, invalidateInterval, endpoints, middlewares, context, keys } = options
  let storage = newStorage(options.storage || 'var/sugos/cloud')
  port = port || 3000
  invalidateInterval = invalidateInterval || 3000
  let server = sgServer({
    endpoints,
    middlewares,
    context,
    keys,
    setup () {

    },
    teardown () {
      return co(function * () {
        return storage.end(true)
      })
    },
    static: options.static || options.public
  })
  server.listen(port)

  let wsServer = sgSocket(server || port)
  let instance = wsServer.httpServer

  let actorService = new ActorService(storage)
  let callerService = new CallerService(storage)
  let observerService = new ObserverService(storage)

  let actorSockets = new SocketPool({})
  let callerSockets = new SocketPool({})
  let observerSockets = new SocketPool({})

  let actorNamespace = new ActorNamespace({})
  let callerNamespace = new CallerNamespace({})
  let observerNamespace = new ObserverNamespace({})

  return co(function * () {
    let scope = {
      actorService,
      callerService,
      observerService,
      actorSockets,
      callerSockets,
      observerSockets
    }

    let actorEndpoint = new ActorEndpoint(scope)
    let callerEndpoint = new CallerEndpoint(scope)

    server.addEndpoints({
      [ACTOR_URL]: { GET: actorEndpoint.list() },
      [CALLER_URL]: { GET: callerEndpoint.list() }
    })

    // Handle SUGO-Actor connections
    wsServer.of(ACTOR_URL)
      .on(CONNECTION, (socket) => actorNamespace.handleConnection(socket, scope))

    // Handle SUGO-Caller connections
    wsServer.of(CALLER_URL)
      .on(CONNECTION, (socket) => callerNamespace.handleConnection(socket, scope))

    // Handle SUGO-Observer connections
    wsServer.of(OBSERVER_URL)
      .on(CONNECTION, (socket) => observerNamespace.handleConnection(socket, scope))

    /**
     * Invalidate actors.
     * Actors may be failed to cleanup when the cloud suddenly killed.
     * @returns {Promise}
     */
    function invalidateActors () {
      return co(function * () {
        let invalidated = yield actorService.invalidate((actor) => {
          let tooSoon = new Date() - new Date(actor.setupAt) < MINIMUM_ALIVE_DURATION
          if (tooSoon) {
            return true
          }
          let { sockets } = wsServer.of(ACTOR_URL).clients()
          return !!sockets[ actor.socketId ]
        })
        for (let key of Object.keys(invalidated)) {
          let socket = actorSockets[ key ]
          if (socket) {
            debug(`Invalided invalid actor: ${key} (socket: ${socket.id})`)
            delete actorSockets[ key ]
          }
        }
      })
    }

    /**
     * Invalidate callers.
     * Callers may be failed to cleanup when the cloud  suddenly killed.
     * @returns {Promise}
     */
    function invalidateCallers () {
      return co(function * () {
        let { sockets } = wsServer.of(CALLER_URL).clients()
        let invalidated = yield callerService.invalidate((caller) => !!sockets[ caller.socketId ])
        for (let key of Object.keys(invalidated)) {
          let socket = callerSockets[ key ]
          if (socket) {
            debug(`Invalided invalid caller: ${key} (socket: ${socket.id})`)
            delete callerSockets[ key ]
          }
        }
      })
    }

    /**
     * Invalidate connections
     * @returns {*|Promise}
     */
    function invalidate () {
      return co(function * () {
        yield instance.invalidateActors()
        yield instance.invalidateCallers()
      })
    }

    debug(`Start invalidate loop with interval: ${invalidateInterval}`)
    let _invalidateTimer = setInterval(() => {
      invalidate()
    }, invalidateInterval).unref()

    invalidate()

    Object.assign(instance, {
      actorService,
      callerService,
      observerService,
      invalidateActors,
      invalidateCallers,
      invalidate,
      _invalidateTimer

    })

    return instance
  })
}

Object.assign(sugoHub, {
  newStorage
})

module.exports = sugoHub
