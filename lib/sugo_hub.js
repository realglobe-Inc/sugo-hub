/**
 * Hub server of SUGOS
 * @class SugoHub
 * @param {Object} [options] - Optional settings
 * @param {string|Object} [options.storage] -  Storage options
 * @param {string} [config.keys] - Koa keys
 * @param {Object} [options.endpoints] - Endpoint settings
 * @param {Object} [config.context] - Koa context prototype
 * @param {string} [config.public] - Public directories.
 * @param {Object} [options.socketIoOptions] - Option object of Socket.IO constructor
 * @param {Object} [options.localActors] - Local actor instances
 * @param {string|boolean} [options.logFile=false] - File name to save logs.
 * @see https://github.com/koajs/koa#readme
 * @see https://github.com/socketio/socket.io#readme
 */
'use strict'

const asleep = require('asleep')
const sgSocket = require('sg-socket')
const sgServer = require('sg-server')
const debug = require('debug')('sg:hub')
const {redisAdaptor, authAdaptor} = require('./adaptors')
const newStorage = require('./helpers/new_storage')
const ioInterceptor = require('./helpers/io_interceptor')

const {ActorConnector, CallerConnector, ObserverConnector} = require('./connectors')
const {ActorService, CallerService, ObserverService, InvocationService} = require('./services')
const {ActorEndpoint, CallerEndpoint} = require('./endpoints')

const {ReservedEvents} = require('sg-socket-constants')

const {CONNECTION} = ReservedEvents

const {HubUrls} = require('sugo-constants')
const {ACTOR_URL, CALLER_URL, OBSERVER_URL} = HubUrls
const hubLogger = require('./logging/hub_logger')
const {localMixin} = require('./mixins')

/** @lends sugoHub */
class SugoHub {
  constructor (options = {}) {
    {
      const {port} = options
      if (typeof port !== 'undefined') {
        throw new Error('[SUGO-Hub] `sugoHub({ port })` is no longer supported. Use `sugoHub({}).listen(port)` instead.')
      }
    }
    const {
      prefix = 'sugo-hub',
      interceptors,
      endpoints,
      middlewares,
      context,
      keys,
      setup,
      teardown,
      authenticate = false,
      socketIoOptions = {},
      logFile = 'var/log/sugo-hub.log',
      localActors = {}
    } = options

    const s = this

    const logger = hubLogger(logFile)

    const storageConfig = options.storage || 'var/sugos/hub'
    const storage = newStorage(storageConfig)

    const server = sgServer({
      endpoints,
      middlewares,
      context,
      keys,
      async setup () {
        await setup && setup()
      },
      async teardown () {
        await teardown && teardown()
        return storage.end(true)
      },
      static: options.static || options.public
    })

    const io = sgSocket(server, socketIoOptions)
    const actorIO = io.of(ACTOR_URL)
    const callerIO = io.of(CALLER_URL)
    const observerIO = io.of(OBSERVER_URL)

    if (storageConfig.redis) {
      const {url, host, port, requestsTimeout} = storageConfig.redis
      redisAdaptor(io, {
        url, host, port, requestsTimeout, prefix
      })
    }

    if (authenticate) {
      authAdaptor(actorIO, {authenticate})
      authAdaptor(callerIO, {authenticate})
      authAdaptor(observerIO, {authenticate})
    }

    const actorService = new ActorService(storage)
    const callerService = new CallerService(storage)
    const observerService = new ObserverService(storage)
    const invocationService = new InvocationService(storage)

    const actorConnector = new ActorConnector({logger})
    const callerConnector = new CallerConnector({logger})
    const observerConnector = new ObserverConnector({logger})

    const scope = {
      actorService,
      callerService,
      observerService,
      invocationService,
      actorIO,
      callerIO,
      observerIO
    }

    const actorEndpoint = new ActorEndpoint(scope)
    const callerEndpoint = new CallerEndpoint(scope)

    server.addEndpoints({
      [ACTOR_URL]: {GET: actorEndpoint.list()},
      [CALLER_URL]: {GET: callerEndpoint.list()}
    })

    // Register interceptors
    for (const url of Object.keys(interceptors || {})) {
      const interceptor = ioInterceptor(...[].concat(interceptors[url] || []))
      io.of(url).use(interceptor)
    }

    // Handle SUGO-Actor connections
    actorIO.on(CONNECTION, (socket) => actorConnector.handleConnection(socket, scope))

    // Handle SUGO-Caller connections
    callerIO.on(CONNECTION, (socket) => callerConnector.handleConnection(socket, scope))

    // Handle SUGO-Observer connections
    observerIO.on(CONNECTION, (socket) => observerConnector.handleConnection(socket, scope))

    Object.assign(s, {
      io,
      storage,
      server,
      actorService,
      callerService,
      localActors
    })
  }

  /**
   * Listen to port
   * @param port
   * @returns {*}
   */
  async listen (port) {
    const s = this
    let {
      server,
      localActors
    } = s
    port = port || s.port
    s.listening = true
    s.port = port
    await server.listen(port)
    await s.connectLocalActors(localActors)
    return s
  }

  /**
   * Close hub
   * @returns {*}
   */
  async close () {
    const s = this
    let {
      server,
      localActors
    } = s
    s.listening = false
    await s.disconnectLocalActors(localActors)
    await server.close()
    await asleep(10) // Wait to flush
    return s
  }
}

Object.assign(SugoHub, {
  newStorage,
  ACTOR_URL,
  CALLER_URL,
  OBSERVER_URL
})

module.exports = localMixin(SugoHub)
