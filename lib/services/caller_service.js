/**
 * Service callers
 * @augments Service
 * @class CallerService
 */
'use strict'

const Service = require('./service')
const co = require('co')
const uuid = require('uuid')
const { CallerEntity } = require('../entities')
const { CallerEvents } = require('sugo-constants')

const { JOIN, LEAVE } = CallerEvents

/** @lends CallerService */
class CallerService extends Service {
  constructor (storage) {
    super(storage, {
      prefix: 'sg:caller',
      indices: [ 'socketId' ],
      entity: 'CallerEntity'
    })
  }

  /**
   * Join to an actor
   * @param {string} socketId - Connecting socket
   * @param {ActorEntity} actor - Actor to join
   * @returns {Promise.<Object>} caller instance
   */
  joinToActor (socketId, actor) {
    const s = this
    return co(function * () {
      let caller = yield s.findBySocketId(socketId)
      caller = caller || new CallerEntity({ key: uuid.v4() })
      caller.addActor(actor)
      caller.set({ socketId })
      yield s.save(caller)
      s.emit(JOIN, {
        key: caller,
        actor: {
          key: actor.key
        }
      })
      return caller
    })
  }

  /**
   * Leave from an actor.
   * @param {string} socketId - Connecting socket
   * @param {ActorEntity} actor - Actor to leave
   * @returns {Promise.<Object>} caller instance
   */
  leaveFromActor (socketId, actor) {
    const s = this
    return co(function * () {
      let caller = yield s.findBySocketId(socketId, { strict: true })
      caller.removeActor(actor)
      let done = caller.actors.length === 0
      if (done) {
        yield s.destroy(caller.key)
      } else {
        yield s.save(caller)
      }
      s.emit(LEAVE, {
        key: caller,
        actor: {
          key: actor.key
        }
      })
      return caller
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

module.exports = CallerService
