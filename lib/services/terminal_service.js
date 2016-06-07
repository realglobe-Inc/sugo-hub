/**
 * @augments Service
 * @class TerminalService
 */
'use strict'

const Service = require('./service')
const co = require('co')

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
   * @param {string} spotKey - Key of spot
   * @returns {Promise.<Object>} terminal instance
   */
  joinToSpot (socketId, spotKey) {
    const s = this
    return co(function * () {
      let terminal = yield s.findByIndex('socketId', socketId)
      terminal = terminal || { socketId, spots: {} }
      let spot = terminal.spots[ spotKey ] || {}
      terminal.spots[ spotKey ] = Object.assign(spot, {
        joinAt: new Date()
      })
      s.save(terminal)
      return terminal
    })
  }

  /**
   * Leave from a spot.
   * @param {string} socketId - Connecting socket
   * @param {string} spotKey - Key of spot
   * @returns {Promise.<Object>} terminal instance
   */
  leaveFromSpot (socketId, spotKey) {
    const s = this
    return co(function * () {
      let terminal = yield s.findByIndex('socketId', socketId)
      terminal = terminal || { spots: {} }
      let spot = terminal.spots[ spotKey ]
      if (!spot) {
        throw new Error(`Not connected with spot ${spotKey}`)
      }
      delete terminal.spots[ spotKey ]
      s.save(terminal)
      return terminal
    })
  }
}

module.exports = TerminalService
