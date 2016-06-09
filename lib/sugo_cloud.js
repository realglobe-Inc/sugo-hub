/**
 * @function sugoCloud
 * @param {Object} [options] - Optional settings
 */
'use strict'

const co = require('co')
const sgSocket = require('sg-socket')
const sgStorage = require('sg-storage')
const debug = require('debug')('sg:cloud')
const { SpotService, TerminalService } = require('./services')

const { GreetingEvents, RemoteEvents, ReservedEvents, AcknowledgeStatus } = require('sg-socket-constants')
const { HI, BYE } = GreetingEvents
const { SPEC, PIPE, JOIN, LEAVE, PERFORM } = RemoteEvents
const { CONNECTION, DISCONNECT } = ReservedEvents
const { OK, NG } = AcknowledgeStatus
const { SPOT_URL, TERMINAL_URL } = require('./constatns/url_constants')

/** @lends sugoCloud */
function sugoCloud (options = {}) {
  let { port } = options
  let wsServer = sgSocket(port)
  let { httpServer } = wsServer

  let storage = sugoCloud.newStorage(options.storage || 'var/sugos/cloud')

  let spotService = new SpotService(storage)
  let terminalService = new TerminalService(storage)

  let handleError = (err) => console.error(err)

  let spotSockets = {}
  let terminalSockets = {}

  return co(function * () {
    // Handle SUGO-Spot connections
    wsServer.of(SPOT_URL).on(CONNECTION, (socket) => {
      let ack = (generator) => spotService.ack(co.wrap(generator))
      let { id } = socket

      // Handle connect request form spot
      socket.on(HI, ack(function * setupSpot (data) {
        let { key, token, force } = data
        let spot = yield spotService.setupSpot(id, key, token, { force })
        if (force) {
          // TODO disconnect existing socket
        }
        debug(`Setup a spot on socket: ${spot.socketId}`)
        spotSockets[ key ] = socket
        return { key: spot.key, token: spot.token }
      }))

      // Handle disconnect request from spot
      socket.on(BYE, ack(function * teardownSpot (data) {
        let { key, token } = data
        let spot = yield spotService.teardownSpot(id, key, token)
        debug(`Teardown a spot on socket: ${spot.socketId}`)
        delete spotSockets[ key ]
        return { key: spot.key, token: spot.token }
      }))

      // Handle spec notice from spot
      socket.on(SPEC, ack(function * updateSpec (data) {
        let { $name, $spec } = data
        let spot = yield spotService.updateSpec(id, $name, $spec)
        debug(`Update spot spec on socket: ${spot.socketId}`)
        return { key: spot.key }
      }))

      // Handle pipe from spot to terminal
      // This does not ack back for performance reason
      socket.on(PIPE, (data) => {
        co(function * () {
          let { key } = data
          // TODO Cache spot to improve performance
          let spot = yield spotService.find(key, { strict: true })
          for (let key of spot.terminals) {
            // TODO Filter terminals
            let socket = terminalSockets[ key ]
            socket.emit(PIPE, data)
          }
        }).catch(handleError)
      })

      socket.on(DISCONNECT, () => co(function * cleanup () {
        let spot = yield spotService.findBySocketId(id)
        if (!spot) {
          return
        }
        for (let key of spot.terminals) {
          let terminal = yield spotService.find(key)
          if (terminal) {
            // TODO notice spot lost
          }
        }
        delete spotSockets[ spot.key ]
      }))
    })

    // Handle SUGO-Terminal connections
    wsServer.of(TERMINAL_URL).on(CONNECTION, (socket) => {
      let ack = (generator) => terminalService.ack(co.wrap(generator))
      let { id } = socket

      // Handle join request from terminal
      socket.on(JOIN, ack(function * joinSpot (data) {
        let spot = yield spotService.find(data.key, { strict: true })
        let terminal = yield terminalService.joinToSpot(id, spot)
        terminalSockets[ terminal.key ] = socket
        spot.addTerminal(terminal)
        debug(`Join terminal "${terminal.key}" to spot "${spot.key}"`)
        yield spotService.save(spot)
        return { key: spot.key, $specs: spot.$specs }
      }))

      // Handle leave request from terminal
      socket.on(LEAVE, ack(function * leaveSpot (data) {
        let spot = yield spotService.find(data.key, { strict: true })
        let terminal = yield terminalService.leaveFromSpot(id, spot)
        delete terminalSockets[ terminal.key ]
        spot.removeTerminal(terminal)
        debug(`Leave terminal "${terminal.key}" from spot "${spot.key}"`)
        yield spotService.save(spot)
        return { key: spot.key }
      }))

      // Handle fire request from terminal
      socket.on(PERFORM, ack(function * performOnSpot (data) {
        let { key } = data
        if (!key) {
          throw new Error('key is required.')
        }
        let spot = yield spotService.find(key, { strict: true })
        let socket = spotSockets[ spot.key ]
        return yield new Promise((resolve, reject) => {
          return socket.emit(PERFORM, data, (data) => {
            let { status, payload } = data
            if (status === NG) {
              reject(payload && payload.message || payload)
              return
            }
            resolve(payload)
          })
        })
      }))

      // Handle pipe from terminal to spot
      socket.on(PIPE, (data) => {
        co(function * () {
          let { key } = data
          if (!key) {
            throw new Error('key is required.')
          }
          let spot = yield spotService.find(key, { strict: true })
          let socket = spotSockets[ spot.key ]
          socket.emit(PIPE, data)
        }).catch(handleError)
      })

      // Cleanup sockets
      socket.on(DISCONNECT, () => co(function * cleanup () {
        let terminal = terminalService.findByIndex('socketId', id)
        if (!terminal) {
          return
        }
        for (let key of terminal.spots) {
          let spot = yield spotService.find(key)
          if (spot) {
            spot.removeTerminal(terminal)
            yield spotService.save(spot)
          }
        }
        yield terminalService.destroy(terminal.key)
        delete terminalSockets[ terminal.key ]
      }))
    })

    httpServer.close = ((close) => function decoratedClose () {
      const CLOSE_DELAY = 100 // Wait for flush
      return new Promise((resolve) =>
        close.call(httpServer, () => {
          setTimeout(() => resolve(), CLOSE_DELAY)
        }))
    })(httpServer.close)
    httpServer.port = port

    return httpServer
  })
}

Object.assign(sugoCloud, {
  /**
   * Create a new storage
   * @param {Object|string} config - Storage config
   */
  newStorage (config) {
    if (config.redis) {
      return sgStorage.redis(config.redis)
    }
    console.warn(`
[sugo-cloud][warning] SHOULD USE REDIS SERVER.
By default, sugo-cloud uses json files to manage connections.
This is handy but may cause performance slow down on production. 
Please consider use redis options. (See https://github.com/realglobe-Inc/sugo-cloud#advanced-usage) 
`)
    return sgStorage(config)
  }
})

module.exports = sugoCloud