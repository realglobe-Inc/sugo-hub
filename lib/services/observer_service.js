/**
 * Service for observers
 * @augments Service
 * @class ObserverService
 */
'use strict'

const Service = require('./service')
const {ObserverEntity} = require('../entities')

const uuid = require('uuid')

/** @lends ObserverService */
class ObserverService extends Service {
  constructor (storage) {
    super(storage, {
      prefix: 'sg:observer',
      indices: ['socketId'],
      entity: 'ObserverEntity'
    })
    const s = this
  }

  /**
   * Start observing
   * @param {string} socketId - Connecting socket
   * @returns {Promise}
   */
  async startObserving (socketId) {
    const s = this
    let observer = await s.findBySocketId(socketId)
    observer = observer || new ObserverEntity({key: uuid.v4()})
    observer.set({socketId, observing: true})
    await s.save(observer)
    return observer
  }

  /**
   * Stop observing
   * @param {string} socketId - Connecting socket
   * @returns {Promise}
   */
  async stopObserving (socketId) {
    const s = this
    let observer = await s.findBySocketId(socketId)
    if (observer) {
      observer.set({observing: false})
      await s.save(observer)
    }
    return observer
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

module.exports = ObserverService
