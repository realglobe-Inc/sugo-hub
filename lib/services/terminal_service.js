/**
 * @augments Service
 * @class TerminalService
 */
'use strict'

const Service = require('./service')
const co = require('co')
const uuid = require('uuid')
const { TerminalEntity } = require('../entities')

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
      s.save(terminal)
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
      s.save(terminal)
      return terminal
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
