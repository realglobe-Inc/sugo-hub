/**
 * @augments Service
 * @class SpotService
 */
'use strict'

const Service = require('./service')
const co = require('co')
const { SpotEntity } = require('../entities')

const uuid = require('uuid')

class SpotService extends Service {
  /**
   * Setup a spot.
   * @param {string} socketId - Id of socket.
   * @param {string} key - Key to of spot
   * @param {string} token - Spot access token.
   * @param {Object} [options={}] - Optional settings
   * @returns {Promise.<Object>} - Created spot.
   */
  setupSpot (socketId, key, token = uuid.v4(), options) {
    const s = this
    return co(function * () {
      if (!key) {
        throw new Error('key is required')
      }
      let spot = yield s.getSpot(key)
      spot = spot || new SpotEntity({ key })
      let tokenNotMatch = spot.token && (spot.token !== token)
      if (tokenNotMatch) {
        if (options.force) {
          spot.set({ token })
        } else {
          throw new Error(`Invalid token to setup: ${token}`)
        }
      }
      spot.set({
        key,
        token,
        socketId,
        setupAt: new Date()
      })
      yield s.saveSpot(key, spot)
      return spot
    })
  }

  /**
   * Teardown a spot.
   * @param {string} socketId - Id of socket.
   * @param {string} key - Key to of spot
   * @param {string} token - Spot access token.
   * @returns {Promise.<Object>} - Created spot.
   */
  teardownSpot (socketId, key, token) {
    const s = this

    return co(function * () {
      let spot = yield s.getSpotBySocketId(socketId)
      if (!spot) {
        throw new Error('Spot not connected')
      }
      let invalidToken = spot.token && (spot.token !== token)
      if (invalidToken) {
        throw new Error(`Invalid token to teardown: ${token}`)
      }

      Object.assign(spot, {
        teardownAt: new Date()
      })

      delete spot.token

      yield s.saveSpot(key, spot)
      yield s.clearSpotSocketId(socketId)

      return spot
    })
  }

  /**
   * Forcefully teardown spot
   * @param {string} socketId - Id of socket.
   * @returns {Promise.<Object>} - Created spot.
   */
  killSpot (socketId) {
    const s = this
    return co(function * () {
      let spot = yield s.getSpotBySocketId(socketId)
      if (spot) {
        delete spot.token
        yield s.saveSpot(spot.key, spot)
        yield s.clearSpotSocketId(socketId)
      }
      return spot
    })
  }

  /**
   * Handle "spec" event
   * @param {string} socketId - Id of socket.
   * @param {string} $name - Spec name
   * @param {Object} $spec - Spec data
   * @returns {Promise.<Object>} - Created spot.
   */
  updateSpec (socketId, $name, $spec) {
    const s = this
    return co(function * () {
      let spot = yield s.getSpotBySocketId(socketId)
      if (!spot) {
        throw new Error('Spot not connected')
      }
      spot.$specs = Object.assign(spot.$specs || {}, {
        [$name]: $spec
      })
      yield s.saveSpot(spot.key, spot)
      return spot
    })
  }

  /**
   * Get spot data with key
   * @param {string} key
   * @param {Object} [options={}] - Optional settings
   * @param {boolean} [options.strict] - Throw error if not found
   * @returns {Promise}
   */
  getSpot (key, options = {}) {
    const s = this
    let { storage } = s
    return co(function * () {
      let data = yield storage.hget('sg:spot', key)
      if (!data) {
        if (options.strict) {
          throw new Error(`Spot not found: ${key}`)
        } else {
          return null
        }
      }
      return SpotEntity.fromJSON(data)
    })
  }

  /**
   * Get spot data from socket id
   * @param socketId
   * @returns {Promise}
   */
  getSpotBySocketId (socketId) {
    const s = this
    let { storage } = s
    return co(function * () {
      let key = yield storage.hget('sg:spot:sockets', socketId)
      if (key) {
        return yield s.getSpot(key)
      }
      throw new Error(`Unknown socket: ${socketId}`)
    })
  }

  /**
   * Save spot data to storage
   * @param {string} key
   * @param {Object} spot
   * @returns {Promise}
   */
  saveSpot (key, spot) {
    const s = this
    let { storage } = s
    return co(function * () {
      yield storage.hset('sg:spot', key, JSON.stringify(spot))
      yield storage.hset('sg:spot:sockets', spot.socketId, spot.key)
    })
  }

  /**
   * Clear spot socket
   * @param {string} socketId
   * @returns {Promise}
   */
  clearSpotSocketId (socketId) {
    const s = this
    let { storage } = s
    return co(function * () {
      yield storage.hdel('sg:spot:sockets', socketId)
    })
  }
}

module.exports = SpotService
