/**
 * Hub server of SUGOS
 * @class SugoHub
 * @param {Object} [options] - Optional settings
 * @param {string|Object} [options.storage] -  Storage options
 * @param {string} [config.keys] - Koa keys
 * @param {Object} [options.endpoints] - Endpoint settings
 * @param {Object} [config.context] - Koa context prototype
 * @param {string} [config.public] - Public directories.
 * @param {number} [options.invalidateInterval=3000] - Interval for invalidate loop
 * @param {Object} [options.socketIoOptions] - Option object of Socket.IO constructor
 */
'use strict'

const co = require('co')
const sgSocket = require('sg-socket')
const sgServer = require('sg-server')
const debug = require('debug')('sg:hub')
const redis = require('redis').createClient
const socketIORedis = require('socket.io-redis')
const socketIOAuth = require('socketio-auth')
const parseUrl = require('url').parse
const newStorage = require('./helpers/new_storage')
const ioInterceptor = require('./helpers/io_interceptor')

const { SocketPool } = require('./pools')
const { ActorNamespace, CallerNamespace, ObserverNamespace } = require('./namespaces')
const { ActorService, CallerService, ObserverService } = require('./services')
const { ActorEndpoint, CallerEndpoint } = require('./endpoints')

const { ReservedEvents } = require('sg-socket-constants')

const { CONNECTION } = ReservedEvents

const { isProduction } = require('asenv')
const aslogger = require('aslogger')
const { HubUrls } = require('sugo-constants')
const { ACTOR_URL, CALLER_URL, OBSERVER_URL } = HubUrls

const MINIMUM_ALIVE_DURATION = 60 * 1000

/** @lends sugoHub */
class SugoHub {
  constructor (options = {}) {
    {
      if (options.port) {
        throw new Error('[SUGO-Hub] `sugoHub({ port })` is no longer supported. Use `sugoHub({}).listen(port)` instead.')
      }
    }
    let devLogger = aslogger({ disabled: isProduction() })
    let {
      prefix = 'sugo-hub',
      invalidateInterval = 24 * 60 * 60 * 1000,
      interceptors,
      endpoints,
      middlewares,
      context,
      keys,
      authenticate = false,
      socketIoOptions = {}
    } = options

    const s = this

    let storageConfig = options.storage || 'var/sugos/cloud'
    let storage = newStorage(storageConfig)

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

    let io = sgSocket(server, socketIoOptions)

    if (storageConfig.redis) {
      let { url, host, port } = storageConfig.redis
      let auth = ''
      if (url) {
        let parsed = parseUrl(url)
        host = parsed.hostname || host
        port = parsed.port || port
        auth = parsed.auth ? parsed.auth.split(':')[ 1 ] : ''
      }
      let pub = redis(port, host, { auth_pass: auth })
      let sub = redis(port, host, { auth_pass: auth, return_buffers: true })
      let client = socketIORedis({ pubClient: pub, subClient: sub, key: `${prefix}:socket.io` })
      io.adapter(client)
    }

    if (authenticate) {
      let authenticateCall = (socket, data, callback) => {
        Promise.resolve(authenticate(socket, data))
          .then((result) => callback(null, result))
          .catch((err) => callback(err))
      }

      socketIOAuth(io.of(ACTOR_URL), { authenticate: authenticateCall })
      socketIOAuth(io.of(CALLER_URL), { authenticate: authenticateCall })
      socketIOAuth(io.of(OBSERVER_URL), { authenticate: authenticateCall })
    }

    let actorService = new ActorService(storage)
    let callerService = new CallerService(storage)
    let observerService = new ObserverService(storage)

    let actorSockets = new SocketPool({})
    let callerSockets = new SocketPool({})
    let observerSockets = new SocketPool({})

    let actorNamespace = new ActorNamespace({})
    let callerNamespace = new CallerNamespace({})
    let observerNamespace = new ObserverNamespace({})

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

    // Register interceptors
    for (let url of Object.keys(interceptors || {})) {
      let interceptor = ioInterceptor(...[].concat(interceptors[ url ] || []))
      devLogger.trace(`Register interceptor on "${url}"`)
      io.of(url).use(interceptor)
    }

    // Handle SUGO-Actor connections
    io.of(ACTOR_URL).on(CONNECTION, (socket) => actorNamespace.handleConnection(socket, scope))

    // Handle SUGO-Caller connections
    io.of(CALLER_URL).on(CONNECTION, (socket) => callerNamespace.handleConnection(socket, scope))

    // Handle SUGO-Observer connections
    io.of(OBSERVER_URL).on(CONNECTION, (socket) => observerNamespace.handleConnection(socket, scope))

    Object.assign(s, {
      io,
      server,
      actorService,
      actorSockets,
      callerService,
      callerSockets
    })

    debug(`Start invalidate loop with interval: ${invalidateInterval}`)
    s._invalidateTimer = setInterval(() => {
      s.invalidate()
    }, invalidateInterval).unref()
  }

  /**
   * Invalidate actors.
   * Actors may be failed to cleanup when the cloud suddenly killed.
   * @returns {Promise}
   */
  invalidateActors () {
    const s = this
    return co(function * () {
      let { io, actorService, actorSockets } = s
      yield actorService.invalidate((actor) => {
        let tooSoon = new Date() - new Date(actor.setupAt) < MINIMUM_ALIVE_DURATION
        if (tooSoon) {
          return true
        }
        let { sockets } = io.of(ACTOR_URL).clients()
        return !!sockets[ actor.socketId ]
      }, (destroyedKey) => {
        let socket = actorSockets[ destroyedKey ]
        if (socket) {
          debug(`Invalidate invalid actor: ${destroyedKey} (socket: ${socket.id})`)
          delete actorSockets[ destroyedKey ]
        }
      })
    })
  }

  /**
   * Invalidate callers.
   * Callers may be failed to cleanup when the cloud  suddenly killed.
   * @returns {Promise}
   */
  invalidateCallers () {
    const s = this
    return co(function * () {
      let { io, callerService, callerSockets } = s
      yield callerService.invalidate((caller) => {
        let { sockets } = io.of(CALLER_URL).clients()
        return !!sockets[ caller.socketId ]
      }, (destroyedKey) => {
        let socket = callerSockets[ destroyedKey ]
        if (socket) {
          debug(`Invalidate invalid caller: ${destroyedKey} (socket: ${socket.id})`)
          delete callerSockets[ destroyedKey ]
        }
      })
    })
  }

  /**
   * Invalidate connections
   * @returns {*|Promise}
   */
  invalidate () {
    const s = this
    return co(function * () {
      yield s.invalidateActors()
      yield s.invalidateCallers()
    })
  }

  /**
   * Listen to port
   * @param port
   * @returns {*}
   */
  listen (port) {
    const s = this
    let { server } = s
    port = port || s.port
    s.listening = true
    s.port = port
    return co(function * () {
      yield server.listen(port)
      return s
    })
  }

  /**
   * Close hub
   * @returns {*}
   */
  close () {
    const s = this
    let { server } = s
    s.listening = false
    return co(function * () {
      yield server.close()
      return s
    })
  }

}

Object.assign(SugoHub, {
  newStorage,
  ACTOR_URL, CALLER_URL, OBSERVER_URL
})

module.exports = SugoHub
