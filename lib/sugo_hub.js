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
 * @param {string} [options.logFile='var/log/sugo-hub-log.log'] - Log filte
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

const { ActorNamespace, CallerNamespace, ObserverNamespace } = require('./namespaces')
const { ActorService, CallerService, ObserverService } = require('./services')
const { ActorEndpoint, CallerEndpoint } = require('./endpoints')

const { ReservedEvents } = require('sg-socket-constants')

const { CONNECTION } = ReservedEvents

const { HubUrls } = require('sugo-constants')
const { ACTOR_URL, CALLER_URL, OBSERVER_URL } = HubUrls
const hubLogger = require('./logging/hub_logger')

/** @lends sugoHub */
class SugoHub {
  constructor (options = {}) {
    {
      let { port } = options
      if (typeof port !== 'undefined') {
        throw new Error('[SUGO-Hub] `sugoHub({ port })` is no longer supported. Use `sugoHub({}).listen(port)` instead.')
      }
    }
    let {
      prefix = 'sugo-hub',
      invalidateInterval = 24 * 60 * 60 * 1000,
      minimumAliveDuration = 60 * 1000,
      interceptors,
      endpoints,
      middlewares,
      context,
      keys,
      authenticate = false,
      socketIoOptions = {},
      logFile = 'var/log/sugo-hub.log'
    } = options

    const s = this

    let logger = hubLogger(logFile)

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
    let actorIO = io.of(ACTOR_URL)
    let callerIO = io.of(CALLER_URL)
    let observerIO = io.of(OBSERVER_URL)

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

      socketIOAuth(actorIO, { authenticate: authenticateCall })
      socketIOAuth(callerIO, { authenticate: authenticateCall })
      socketIOAuth(observerIO, { authenticate: authenticateCall })
    }

    let actorService = new ActorService(storage)
    let callerService = new CallerService(storage)
    let observerService = new ObserverService(storage)

    let actorNamespace = new ActorNamespace({ logger })
    let callerNamespace = new CallerNamespace({ logger })
    let observerNamespace = new ObserverNamespace({ logger })

    let scope = {
      actorService,
      callerService,
      observerService,
      actorIO,
      callerIO,
      observerIO
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
      io.of(url).use(interceptor)
    }

    // Handle SUGO-Actor connections
    actorIO.on(CONNECTION, (socket) => actorNamespace.handleConnection(socket, scope))

    // Handle SUGO-Caller connections
    callerIO.on(CONNECTION, (socket) => callerNamespace.handleConnection(socket, scope))

    // Handle SUGO-Observer connections
    observerIO.on(CONNECTION, (socket) => observerNamespace.handleConnection(socket, scope))

    Object.assign(s, {
      minimumAliveDuration,
      io,
      server,
      actorService,
      callerService
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
    let { minimumAliveDuration } = s
    return co(function * () {
      let { io, actorService } = s
      let actorIO = io.of(ACTOR_URL)
      yield actorService.invalidate((actor) => {
        let tooSoon = new Date() - new Date(actor.setupAt) < minimumAliveDuration
        if (tooSoon) {
          return true
        }
        let { sockets } = actorIO.clients()
        return !!sockets[ actor.socketId ]
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
      let { io, callerService } = s
      let callerIO = io.of(CALLER_URL)
      yield callerService.invalidate((caller) => {
        let { sockets } = callerIO.clients()
        return !!sockets[ caller.socketId ]
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
  ACTOR_URL,
  CALLER_URL,
  OBSERVER_URL
})

module.exports = SugoHub
