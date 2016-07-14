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
   * Setup a spot.
   * @param {string} socketId - Id of socket.
   * @param {string} key - Key to of spot
   * @param {Object} [options={}] - Optional settings
   * @returns {Promise.<Object>} - Created spot.
   */
  setupSpot (socketId, key, options = {}) {
    const s = this
    return co(function * () {
      if (!key) {
        throw new Error('key is required')
      }
      let spot = yield s.find(key)
      spot = spot || new SpotEntity({ key })
      spot.set({
        key,
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
   * @returns {Promise.<Object>} - Created spot.
   */
  teardownSpot (socketId, key) {
    const s = this

    return co(function * () {
      let spot = yield s.findBySocketId(socketId, { strict: true })

      Object.assign(spot, {
        teardownAt: new Date()
      })

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
