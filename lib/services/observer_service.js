/**
 * @augments Service
 * @class ObserverService
 */
'use strict'

const Service = require('./service')
const co = require('co')
const { ObserverEntity } = require('../entities')

const uuid = require('uuid')

class ObserverService extends Service {
  constructor (storage) {
    super(storage, {
      prefix: 'sg:observer',
      indices: [ 'socketId' ],
      entity: 'ObserverEntity'
    })
    const s = this
  }

  /**
   * Start observing
   * @param {string} socketId - Connecting socket
   * @returns {Promise}
   */
  startObserving (socketId) {
    const s = this
    return co(function * () {
      let observer = yield s.findBySocketId(socketId)
      observer = observer || new ObserverEntity({ key: uuid.v4() })
      observer.set({ socketId, observing: true })
      s.save(observer)
      return observer
    })
  }

  /**
   * Stop observing
   * @param {string} socketId - Connecting socket
   * @returns {Promise}
   */
  stopObserving (socketId) {
    const s = this
    return co(function * () {
      let observer = yield s.findBySocketId(socketId, { strict: true })
      observer.set({ observing: false })
      s.save(observer)
      return observer
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

module.exports = ObserverService
