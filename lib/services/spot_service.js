/**
 * @augments Service
 * @class SpotService
 */
'use strict'

const Service = require('./service')
const co = require('co')
const { SpotEntity } = require('../entities')
const { SpotEvents } = require('../events')
const sgValidator = require('sg-validator')
const sgSchemas = require('sg-schemas')
const { SETUP, UPDATE, TEARDOWN } = SpotEvents
const uuid = require('uuid')

class SpotService extends Service {
  constructor (storage) {
    super(storage, {
      prefix: 'sg:spot',
      indices: [ 'socketId' ],
      entity: 'SpotEntity'
    })
  }

  /**
   * Set token
   * @param {string} key - Key to of spot
   * @param {string} token - Spot access token.
   */
  registerToken (key, token) {
    const s = this
    return co(function * () {
      let spot = yield s.find(key)
      spot = spot || new SpotEntity({ key })
      spot.set({ token })
      yield s.save(spot)
      return spot
    })
  }

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
      let spot = yield s.find(key)
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
      yield s.save(spot)
      s.emit(SETUP, {
        key: spot.key
      })
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
      let spot = yield s.findBySocketId(socketId, { strict: true })
      let invalidToken = spot.token && (spot.token !== token)
      if (invalidToken) {
        throw new Error(`Invalid token to teardown: ${token}`)
      }

      Object.assign(spot, {
        teardownAt: new Date()
      })

      delete spot.token

      yield s.save(spot)
      s.emit(TEARDOWN, {
        key: spot.key
      })
      
      return spot
    })
  }

  /**
   * Handle "spec" event
   * @param {string} socketId - Id of socket.
   * @param {string} name - Spec name
   * @param {Object} spec - Spec data
   * @returns {Promise.<Object>} - Created spot.
   */
  updateSpec (socketId, name, spec) {
    const s = this
    return co(function * () {
      SpotService.validateSpec(spec)
      let spot = yield s.findBySocketId(socketId, { strict: true })
      spot.$specs = Object.assign(spot.$specs || {}, {
        [name]: spec
      })
      yield s.save(spot)
      s.emit(UPDATE, {
        key: spec.key,
        spec: {
          [name]: spec
        }
      })
      return spot
    })
  }

  /** @override */
  info () {
    const s = this
    let info = super.info
    return co(function * () {
      let data = yield info.call(s)
      return data.map((data) => {
        delete data.token
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

Object.assign(SpotService, {
  /**
   * Validate a spec data
   * @param {Object} spec
   */
  validateSpec (spec) {
    let validator = sgValidator(sgSchemas.interfaceSpec)
    let errors = validator.validate(spec)
    if (errors && errors.length > 0) {
      let { message } = errors[ 0 ]
      throw new Error(`[SUGO-Cloud] Received an invalid spec: ${message}`)
    }
  }
})
module.exports = SpotService
