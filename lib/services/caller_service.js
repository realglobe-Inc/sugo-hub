/**
 * Service callers
 * @augments Service
 * @class CallerService
 */
'use strict'

const Service = require('./service')
const uuid = require('uuid')
const {CallerEntity} = require('../entities')
const {CallerEvents} = require('sugo-constants')

const {JOIN, LEAVE} = CallerEvents

/** @lends CallerService */
class CallerService extends Service {
  constructor (storage) {
    super(storage, {
      prefix: 'sg:caller',
      indices: ['socketId'],
      entity: 'CallerEntity'
    })
  }

  /**
   * Join to an actor
   * @param {string} socketId - Connecting socket
   * @param {ActorEntity} actor - Actor to join
   * @returns {Promise.<Object>} caller instance
   */
  async joinToActor (socketId, actor) {
    const s = this
    let caller = await s.findBySocketId(socketId)
    caller = caller || new CallerEntity({key: uuid.v4()})
    caller.addActor(actor)
    caller.set({socketId})
    await s.save(caller)
    s.emit(JOIN, {
      key: caller,
      actor: {
        key: actor.key
      }
    })
    return caller
  }

  /**
   * Leave from an actor.
   * @param {string} socketId - Connecting socket
   * @param {ActorEntity} actor - Actor to leave
   * @returns {Promise.<Object>} caller instance
   */
  async leaveFromActor (socketId, actor) {
    const s = this
    let caller = await s.findBySocketId(socketId, {strict: true})
    caller.removeActor(actor)
    let done = caller.actors.length === 0
    if (done) {
      await s.destroy(caller.key)
    } else {
      await s.save(caller)
    }
    s.emit(LEAVE, {
      key: caller,
      actor: {
        key: actor.key
      }
    })
    return caller
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
    return await s.findByIndex('socketId', socketId, options)
  }
}

module.exports = CallerService
