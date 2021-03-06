/**
 * Service for actors
 * @augments Service
 * @class ActorService
 */
'use strict'

const Service = require('./service')
const {ActorEntity} = require('../entities')
const {ActorEvents} = require('sugo-constants')
const sgValidator = require('sg-validator')
const sgSchemas = require('sg-schemas')
const {SETUP, UPDATE, TEARDOWN} = ActorEvents

/** @lends ActorService */
class ActorService extends Service {
  constructor (storage) {
    super(storage, {
      prefix: 'sg:actor',
      indices: ['socketId'],
      entity: 'ActorEntity'
    })
  }

  /**
   * Setup an actor.
   * @param {string} socketId - Id of socket.
   * @param {string} key - Key to of actor
   * @param {Object} [options={}] - Optional settings
   * @returns {Promise.<Object>} - Created actor.
   */
  async setupActor (socketId, key, options = {}) {
    const s = this
    if (!key) {
      throw new Error('[SUGO-Hub] key is required')
    }
    let actor = await s.find(key)
    actor = actor || new ActorEntity({key})
    actor.set({
      key,
      socketId,
      setupAt: new Date()
    })
    await s.save(actor)
    s.emit(SETUP, {
      key: actor.key
    })
    return actor
  }

  /**
   * Teardown an actor.
   * @param {string} socketId - Id of socket.
   * @param {string} key - Key to of actor
   * @returns {Promise.<Object>} - Created actor.
   */
  async teardownActor (socketId, key) {
    const s = this

    let actor = await s.findBySocketId(socketId, {strict: true})

    Object.assign(actor, {
      teardownAt: new Date()
    })

    await s.save(actor)
    s.emit(TEARDOWN, {
      key: actor.key
    })

    return actor
  }

  /**
   * Handle "spec" event
   * @param {string} socketId - Id of socket.
   * @param {string} name - Spec name
   * @param {Object} spec - Spec data
   * @returns {Promise.<Object>} - Created actor.
   */
  async updateSpec (socketId, name, spec) {
    const s = this
    ActorService.validateSpec(spec)
    let actor = await s.findBySocketId(socketId, {strict: true})
    actor.$specs = Object.assign(actor.$specs || {}, {
      [name]: spec
    })
    let {key} = actor
    await s.save(actor)
    s.emit(UPDATE, {
      key,
      spec: {
        [name]: spec
      }
    })
    return actor
  }

  /**
   * Handle "despec" event
   * @param {string} socketId - Id of socket.
   * @param {string} name - Spec name
   */
  async delSpec (socketId, name) {
    const s = this
    let actor = await s.findBySocketId(socketId, {strict: true})
    delete actor.$specs[name]
    let {key} = actor
    await s.save(actor)
    s.emit(UPDATE, {
      key, spec: {[name]: null}
    })
    return actor
  }

  /** @override */
  async info () {
    const s = this
    let info = super.info
    let data = await info.call(s)
    return data.map((data) => {
      return data
    })
  }

  /**
   * Find by socket id
   * @param {string} socketId
   * @param {Object} [options={}] - Optional settings
   * @returns {Promise}
   */
  async findBySocketId (socketId, options = {}) {
    const s = this
    return s.findByIndex('socketId', socketId, options)
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
      let {message} = errors[0]
      throw new Error(`[SUGO-Hub] Received an invalid spec: ${message}`)
    }
  }
})
module.exports = ActorService
