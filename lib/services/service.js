/**
 * Abstract service
 * @abstract
 * @class Service
 * @param {Object} storage - SgStorage instance
 * @param {Object} [options] - Optional settings
 * @param {string} [options.prefix] - Prefix of keys service use
 * @param {string} [options.indices=[]] - Name of index keys
 * @param {string} [options.entity] - Name of entity
 */
'use strict'

const { EventEmitter } = require('events')
const co = require('co')
const assert = require('assert')
const entities = require('../entities')

const { AcknowledgeStatus } = require('sg-socket-constants')
const { OK, NG } = AcknowledgeStatus

let ok = (payload) => ({ status: OK, payload })
let ng = (payload) => ({ status: NG, payload })

class Service extends EventEmitter {
  constructor (storage, options = {}) {
    super()

    const s = this
    s.storage = storage
    s.Entity = entities[ options.entity || 'Entity' ]
    s.prefix = options.prefix || 'sg'
    s.indices = [].concat(options.indices || [])

    s.hkeyForEntities = () => `${s.prefix}:entities`
    s.hkeyForIndices = (index) => `${s.prefix}:indices:${index}`
  }

  /**
   * Handle and callback as socket.IO acknowledge
   * @param {function} handler - Data handler function
   * @returns {function}
   */
  ack (handler) {
    return co.wrap(function * ackImpl (data, callback) {
      try {
        let result = yield Promise.resolve(handler(data))
        callback(ok(result))
      } catch (err) {
        callback(ng(err && err.message || err))
      }
    })
  }

  /**
   * Save entity to storage
   * @param {Entity} entity - Entity to save
   * @returns {Promise}
   */
  save (entity) {
    const s = this
    let { storage } = s
    let { key } = entity
    return co(function * () {
      yield storage.hset(s.hkeyForEntities(), key, JSON.stringify(entity))
      for (let index of s.indices) {
        yield storage.hset(s.hkeyForIndices(index), entity[ index ], key)
      }
    })
  }

  /**
   * Get entity by key
   * @param {string} key - Key of the entity
   * @param {Object} [options={}] - Optional settings
   * @param {boolean} [options.strict] - Throw error if not found
   * @returns {Promise.<Entity>}
   */
  find (key, options = {}) {
    const s = this
    let { Entity, storage } = s
    return co(function * () {
      let data = yield storage.hget(s.hkeyForEntities(), key)
      if (!data) {
        if (options.strict) {
          throw new Error(`${Entity.$name || Entity.name} not found for key: ${key}`)
        } else {
          return null
        }
      }
      return new Entity(JSON.parse(data))
    })
  }

  /**
   * Find entity bin index.
   * @param {string} indexKey - Key of the index.
   * @param {string} indexValue - Value of the index
   * @param {Object} [options] - Find options
   * @returns {Promise.<Entity>}
   */
  findByIndex (indexKey, indexValue, options) {
    const s = this
    let { storage } = s
    assert.ok(!!~s.indices.indexOf(indexKey))
    return co(function * () {
      let key = yield storage.hget(s.hkeyForIndices(indexKey), indexValue)
      return yield s.find(key, options)
    })
  }

  /**
   * Destroy entity
   * @param {string} key - Key of the entity
   * @returns {Promise.<number>}
   */
  destroy (key) {
    const s = this
    let { storage } = s
    return co(function * () {
      let entity = yield s.find(key)
      if (!entity) {
        return 0
      }
      yield storage.hdel(s.hkeyForEntities(), key)
      for (let index of s.indices) {
        yield storage.hdel(s.hkeyForIndices(index), entity[ index ])
      }
      return 1
    })
  }
}

module.exports = Service