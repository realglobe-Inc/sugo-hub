/**
 * Namespace for spot
 * @class TerminalNamespace
 */
'use strict'

const co = require('co')
const Namespace = require('./namespace')

const { RemoteEvents, ReservedEvents, AcknowledgeStatus } = require('sg-socket-constants')
const { PIPE, JOIN, LEAVE, PERFORM } = RemoteEvents
const { OK, NG } = AcknowledgeStatus
const { DISCONNECT } = ReservedEvents

const debug = require('debug')('sg:cloud:terminal')

/** @lends TerminalNamespace */
class TerminalNamespace extends Namespace {
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

    // Handle join request from terminal
    socket.on(JOIN, s.ack(function * joinToSpot (data) {
      let spot = yield spotService.find(data.key, { strict: true })
      let terminal = yield terminalService.joinToSpot(id, spot)
      terminalSockets[ terminal.key ] = socket
      spot.addTerminal(terminal)
      debug(`Join terminal "${terminal.key}" to spot "${spot.key}"`)
      yield spotService.save(spot)
      return { key: spot.key, specs: spot.$specs }
    }))

    // Handle leave request from terminal
    socket.on(LEAVE, s.ack(function * leaveSpot (data) {
      let spot = yield spotService.find(data.key, { strict: true })
      let terminal = yield terminalService.leaveFromSpot(id, spot)
      delete terminalSockets[ terminal.key ]
      spot.removeTerminal(terminal)
      debug(`Leave terminal "${terminal.key}" from spot "${spot.key}"`)
      yield spotService.save(spot)
      return { key: spot.key }
    }))

    // Handle fire request from terminal
    socket.on(PERFORM, s.ack(function * performOnSpot (data) {
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
      }).catch((err) => s.handleError(err))
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
  }
}

module.exports = TerminalNamespace
