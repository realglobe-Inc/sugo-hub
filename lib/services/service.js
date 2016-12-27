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

let isEmpty = (value) => value === null || typeof value === 'undefined'

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

    s.setMaxListeners(Infinity)
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
    let { Entity } = s
    return co(function * () {
      let data = yield s._entitiesWithKey(key)
      if (!data) {
        if (options.strict) {
          throw new Error(`${Entity.$name || Entity.name} not found for key: ${JSON.stringify(key)}`)
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
  findByIndex (indexKey, indexValue, options = {}) {
    const s = this
    assert.ok(!!~s.indices.indexOf(indexKey))
    return co(function * () {
      let key = yield s._indicesWithKeyValue(indexKey, indexValue)
      let failed = options.strict && !key
      if (failed) {
        throw new Error(`Key not found with index ${indexKey}="${indexValue}"`)
      }
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

  /**
   * Get info
   * @returns {Promise.<Object>}
   */
  info () {
    const s = this
    let { storage } = s
    return co(function * () {
      let result = []
      let data = yield storage.hgetall(s.hkeyForEntities())
      data = data || {}
      for (let key of Object.keys(data)) {
        let entity = JSON.parse(data[ key ])
        result.push(entity)
      }
      return result
    })
  }

  /**
   * Invalidate sockets
   * @param {function} validator
   * @param {function} onDestroy
   * @returns {Promise}
   */
  invalidate (validator, onDestroy) {
    const s = this
    return co(function * () {
      let entries = yield s.info()
      let result = {}
      for (let entry of entries) {
        let { key } = entry
        let valid = validator(entry)
        if (!valid) {
          result[ key ] = entry
          yield s.destroy(key)
          if (onDestroy) {
            onDestroy(key)
          }
        }
      }
      return result
    })
  }

  /**
   * Get indices with key and value
   * @param indexKey
   * @param indexValue
   * @returns {Promise}
   * @private
   */
  _indicesWithKeyValue (indexKey, indexValue) {
    const s = this
    let { storage } = s
    return co(function * () {
      if (isEmpty(indexValue)) {
        return null
      }
      return yield storage.hget(s.hkeyForIndices(indexKey), indexValue)
    })
  }

  /**
   * Get entities with key
   * @param {string} key
   * @returns {Promise}
   * @private
   */
  _entitiesWithKey (key) {
    const s = this
    let { storage } = s
    return co(function * () {
      if (isEmpty(key)) {
        return null
      }
      return yield storage.hget(s.hkeyForEntities(), key)
    })
  }
}

module.exports = Service
