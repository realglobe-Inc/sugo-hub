/**
 * @augments Service
 * @class TerminalService
 */
'use strict'

const Service = require('./service')
const co = require('co')
const uuid = require('uuid')
const { TerminalEntity } = require('../entities')
const { TerminalEvents } = require('../events')

const { JOIN, LEAVE } = TerminalEvents

class TerminalService extends Service {
  constructor (storage) {
    super(storage, {
      prefix: 'sg:terminal',
      indices: [ 'socketId' ],
      entity: 'TerminalEntity'
    })
  }

  /**
   * Join to a spot
   * @param {string} socketId - Connecting socket
   * @param {SpotEntity} spot - Spot to join
   * @returns {Promise.<Object>} terminal instance
   */
  joinToSpot (socketId, spot) {
    const s = this
    return co(function * () {
      let terminal = yield s.findBySocketId(socketId)
      terminal = terminal || new TerminalEntity({ key: uuid.v4() })
      terminal.addSpot(spot)
      terminal.set({ socketId })
      yield s.save(terminal)
      s.emit(JOIN, {
        key: terminal,
        spot: {
          key: spot.key
        }
      })
      return terminal
    })
  }

  /**
   * Leave from a spot.
   * @param {string} socketId - Connecting socket
   * @param {SpotEntity} spot - Spot to leave
   * @returns {Promise.<Object>} terminal instance
   */
  leaveFromSpot (socketId, spot) {
    const s = this
    return co(function * () {
      let terminal = yield s.findBySocketId(socketId, { strict: true })
      terminal.removeSpot(spot)
      let done = terminal.spots.length === 0
      if (done) {
        yield s.destroy(terminal)
      } else {
        yield s.save(terminal)
      }
      s.emit(LEAVE, {
        key: terminal,
        spot: {
          key: spot.key
        }
      })
      return terminal
    })
  }

  /** @override */
  info () {
    const s = this
    let info = super.info
    return co(function * () {
      let data = yield info.call(s)
      return data.map((data) => {
        return data
      })
    })
  }

  /**
   * Find by socket id
   * @param {string} socketId
   * @param {Object} [options={}] - Optional settings
   * @returns {Promise}
   */
  findBySocketId (socketId, options = {}) {
    const s = this
    return co(function * () {
      return yield s.findByIndex('socketId', socketId, options)
    })
  }
}

module.exports = TerminalService
