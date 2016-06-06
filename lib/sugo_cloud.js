/**
 * @function sugoCloud
 * @param {Object} [options] - Optional settings
 */
'use strict'

const co = require('co')
const sgSocket = require('sg-socket')
const sgStorage = require('sg-storage')
const debug = require('debug')('sg:cloud')
const { SpotConnector, TerminalConnector } = require('./connectors')

const { GreetingEvents, RemoteEvents, ReservedEvents, AcknowledgeStatus } = require('sg-socket-constants')
const { HI, BYE } = GreetingEvents
const { SPEC, PIPE, JOIN, LEAVE, PERFORM } = RemoteEvents
const { CONNECTION, DISCONNECT } = ReservedEvents
const { OK, NG } = AcknowledgeStatus
const { SPOT_URL, TERMINAL_URL } = require('./constatns/url_constants')

/** @lends sugoCloud */
function sugoCloud (options = {}) {
  let wsServer = sgSocket(options.port)
  let { httpServer } = wsServer

  // TODO Use redis (via sgStorage.redis function)
  let storage = sgStorage(options.storage || 'var/sugos/cloud')
  let spots = new SpotConnector(storage)
  let terminals = new TerminalConnector(storage)

  let handleError = (err) => console.error(err)

  return co(function * () {
    // Handle SUGO-Spot connections
    wsServer.of(SPOT_URL).on(CONNECTION, (socket) => {
      let ack = (generator) => spots.ack(co.wrap(generator))
      let { id } = socket

      // Handle connect request form spot
      socket.on(HI, ack(function * setupSpot (data) {
        let { key, token, force } = data
        let spot = yield spots.setupSpot(id, key, token, { force })
        debug(`Setup a spot on socket: ${spot.socketId}`)
        token = spot.token
        key = spot.key
        spots.sockets[ key ] = socket
        return { key, token }
      }))

      // Handle disconnect request from spot
      socket.on(BYE, ack(function * teardownSpot (data) {
        let { key, token } = data
        let spot = yield spots.teardownSpot(id, key, token)
        debug(`Teardown a spot on socket: ${spot.socketId}`)
        delete spots.sockets[ key ]
        return { key, token }
      }))

      // Handle spec notice from spot
      socket.on(SPEC, ack(function * updateSpec (data) {
        let { $name, $spec } = data
        let spot = yield spots.updateSpec(id, $name, $spec)
        let { key } = spot
        debug(`Update spot spec on socket: ${spot.socketId}`)
        return { key }
      }))

      // Handle pipe from spot to termianl
      socket.on(PIPE, (data) => {
        co(function * () {
          let { key } = data
          // TODO Cache spot to improve performance
          let spot = yield spots.getSpot(key, { strict: true })
          for (let id of Object.keys(spot.terminals || {})) {
            // TODO Filter terminals
            let socket = terminals.sockets[ id ]
            socket.emit(PIPE, data)
          }
        }).catch(handleError)
      })

      socket.on(DISCONNECT, () => co(function * cleanup () {
        let spot = yield spots.killSpot(id)
        if (spot) {
          delete spots.sockets[ spot.key ]
        }
      }))
    })

    // Handle SUGO-Terminal connections
    wsServer.of(TERMINAL_URL).on(CONNECTION, (socket) => {
      let ack = (generator) => terminals.ack(co.wrap(generator))
      let { id } = socket

      // Handle join request from terminal
      socket.on(JOIN, ack(function * joinSpot (data) {
        let spot = yield spots.getSpot(data.key, { strict: true })
        let terminal = yield terminals.joinToSpot(id, spot.key)
        terminals.sockets[ id ] = socket
        spot.terminals[ id ] = terminal
        debug(`Join terminal "${terminal.socketId}" to spot "${spot.key}"`)
        yield spots.saveSpot(spot.key, spot)
        return { key: spot.key, $specs: spot.$specs }
      }))

      // Handle leave request from terminal
      socket.on(LEAVE, ack(function * leaveSpot (data) {
        let spot = yield spots.getSpot(data.key, { strict: true })
        let terminal = yield terminals.leaveFromSpot(id, spot.key)
        delete terminals.sockets[ id ]
        delete spot.terminals[ id ]
        debug(`Leave terminal "${terminal.socketId}" from spot "${spot.key}"`)
        yield spots.saveSpot(spot.key, spot)
        return { key: spot.key }
      }))

      // Handle fire request from terminal
      socket.on(PERFORM, ack(function * performOnSpot (data) {
        let { key } = data
        if (!key) {
          throw new Error('key is required.')
        }
        let spot = yield spots.getSpot(key, { strict: true })
        let socket = spots.sockets[ spot.key ]
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
          let spot = yield spots.getSpot(key, { strict: true })
          let socket = spots.sockets[ spot.key ]
          socket.emit(PIPE, data)
        }).catch(handleError)
      })

      // Cleanup sockets
      socket.on(DISCONNECT, () => co(function * cleanup () {
        let terminal = terminals.getTerminal(id)
        for (let key of terminal.spots) {
          let spot = yield spots.getSpot(key)
          if (spot) {
            delete spot.terminals[ id ]
            yield spots.saveSpot(spot.key, spot)
          }
        }
        yield terminals.delTerminal(id)
        for (let id of Object.keys(terminals.sockets)) {
          let socket = terminals.sockets[ id ]
          if (socket.id === id) {
            delete terminals.sockets[ id ]
          }
        }
      }))
    })

    httpServer.close = ((close) => function decoratedClose () {
      const CLOSE_DELAY = 100 // Wait for flush
      return new Promise((resolve) =>
        close.call(httpServer, () => {
          setTimeout(() => resolve(), CLOSE_DELAY)
        }))
    })(httpServer.close)

    return httpServer
  })
}

Object.assign(sugoCloud, {})

module.exports = sugoCloud
