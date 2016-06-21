/**
 * Namespace for spot
 * @class SpotNamespace
 */
'use strict'

const co = require('co')
const Namespace = require('./namespace')

const { GreetingEvents, RemoteEvents, ReservedEvents } = require('sg-socket-constants')
const { SPEC, PIPE } = RemoteEvents
const { HI, BYE } = GreetingEvents
const { DISCONNECT } = ReservedEvents

const debug = require('debug')('sg:cloud:spot')

/** @lends SpotNamespace */
class SpotNamespace extends Namespace {
  constructor (options) {
    super()
    const s = this
  }

  /**
   * @override
   */
  handleConnection (socket, scope) {
    const s = this

    let { spotService, terminalService, terminalSockets, spotSockets } = scope
    let { id } = socket

    // Handle connect request form spot
    socket.on(HI, s.ack(function * setupSpot (data) {
      let { key, token, force } = data
      let spot = yield spotService.setupSpot(id, key, token, { force })
      if (force) {
        s.killSocket(spotSockets[ key ])
      }
      debug(`Setup a spot on socket: ${spot.socketId}`)
      spotSockets[ key ] = socket
      return { key: spot.key, token: spot.token }
    }))

    // Handle disconnect request from spot
    socket.on(BYE, s.ack(function * teardownSpot (data) {
      let { key, token } = data
      let spot = yield spotService.teardownSpot(id, key, token)
      debug(`Teardown a spot on socket: ${spot.socketId}`)
      delete spotSockets[ key ]
      return { key: spot.key, token: spot.token }
    }))

    // Handle spec notice from spot
    socket.on(SPEC, s.ack(function * updateSpec (data) {
      let { name, spec } = data
      let spot = yield spotService.updateSpec(id, name, spec)
      debug(`Update spot spec on socket: ${spot.socketId}`)
      return { key: spot.key }
    }))

    // Handle pipe from spot to terminal
    // This does not ack back for performance reason
    socket.on(PIPE, (data) => {
      co(function * () {
        let { key } = data
        let spot = yield spotService.find(key, { strict: true })
        for (let key of spot.terminals) {
          let socket = terminalSockets[ key ]
          if (socket) {
            socket.emit(PIPE, data)
          }
        }
      }).catch((err) => s.handleError(err))
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
      yield spotService.destroy(spot.key)
      delete spotSockets[ spot.key ]
    }))
  }
}

module.exports = SpotNamespace
