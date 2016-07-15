/**
 * @augments Service
 * @class ActorService
 */
'use strict'

const Service = require('./service')
const co = require('co')
const { ActorEntity } = require('../entities')
const { ActorEvents } = require('../events')
const sgValidator = require('sg-validator')
const sgSchemas = require('sg-schemas')
const { SETUP, UPDATE, TEARDOWN } = ActorEvents
const uuid = require('uuid')

class ActorService extends Service {
  constructor (storage) {
    super(storage, {
      prefix: 'sg:actor',
      indices: [ 'socketId' ],
      entity: 'ActorEntity'
    })
  }

  /**
   * Setup a actor.
   * @param {string} socketId - Id of socket.
   * @param {string} key - Key to of actor
   * @param {Object} [options={}] - Optional settings
   * @returns {Promise.<Object>} - Created actor.
   */
  setupActor (socketId, key, options = {}) {
    const s = this
    return co(function * () {
      if (!key) {
        throw new Error('key is required')
      }
      let actor = yield s.find(key)
      actor = actor || new ActorEntity({ key })
      actor.set({
        key,
        socketId,
        setupAt: new Date()
      })
      yield s.save(actor)
      s.emit(SETUP, {
        key: actor.key
      })
      return actor
    })
  }

  /**
   * Teardown a actor.
   * @param {string} socketId - Id of socket.
   * @param {string} key - Key to of actor
   * @returns {Promise.<Object>} - Created actor.
   */
  teardownActor (socketId, key) {
    const s = this

    return co(function * () {
      let actor = yield s.findBySocketId(socketId, { strict: true })

      Object.assign(actor, {
        teardownAt: new Date()
      })

      yield s.save(actor)
      s.emit(TEARDOWN, {
        key: actor.key
      })

      return actor
    })
  }

  /**
   * Handle "spec" event
   * @param {string} socketId - Id of socket.
   * @param {string} name - Spec name
   * @param {Object} spec - Spec data
   * @returns {Promise.<Object>} - Created actor.
   */
  updateSpec (socketId, name, spec) {
    const s = this
    return co(function * () {
      ActorService.validateSpec(spec)
      let actor = yield s.findBySocketId(socketId, { strict: true })
      actor.$specs = Object.assign(actor.$specs || {}, {
        [name]: spec
      })
      yield s.save(actor)
      s.emit(UPDATE, {
        key: spec.key,
        spec: {
          [name]: spec
        }
      })
      return actor
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

Object.assign(ActorService, {
  /**
   * Validate a spec data
   * @param {Object} spec
   */
  validateSpec (spec) {
    let validator = sgValidator(sgSchemas.moduleSpec)
    let errors = validator.validate(spec)
    if (errors && errors.length > 0) {
      let { message } = errors[ 0 ]
      throw new Error(`[SUGO-Cloud] Received an invalid spec: ${message}`)
    }
  }
})
module.exports = ActorService
