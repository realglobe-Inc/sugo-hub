/**
 * @augments Service
 * @class TerminalService
 */
'use strict'

const Service = require('./service')
const co = require('co')

const uuid = require('uuid')
let noop = () => undefined

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
      let terminal = yield s.getTerminal(socketId)
      terminal = terminal || { socketId, spots: {} }
      let spot = terminal.spots[ spotKey ] || {}
      terminal.spots[ spotKey ] = Object.assign(spot, {
        joinAt: new Date()
      })
      s.saveTerminal(socketId, terminal)
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
      let terminal = yield s.getTerminal(socketId)
      terminal = terminal || { spots: {} }
      let spot = terminal.spots[ spotKey ]
      if (!spot) {
        throw new Error(`Not connected with spot ${spotKey}`)
      }
      delete terminal.spots[ spotKey ]
      s.saveTerminal(socketId, terminal)
      return terminal
    })
  }

  /**
   * Get terminal data
   * @param {string} socketId
   * @returns {Promise}
   */
  getTerminal (socketId) {
    const s = this
    let { storage } = s
    return co(function * () {
      let data = yield storage.hget('sg:terminal', socketId)
      return data && JSON.parse(data)
    })
  }

  /**
   * Save terminal data
   * @param {string} socketId
   * @param {Object} terminal
   * @returns {Promise}
   */
  saveTerminal (socketId, terminal) {
    const s = this
    let { storage } = s
    return co(function * () {
      yield storage.hset('sg:terminal', socketId, JSON.stringify(terminal))
    })
  }

  /**
   * Delete terminal data
   * @param {string} socketId
   * @returns {Promise}
   */
  delTerminal (socketId) {
    const s = this
    let { storage } = s
    return co(function * () {
      yield storage.hdel('sg:terminal', socketId)
    })
  }
}

module.exports = TerminalService
