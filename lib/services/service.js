/**
 * Abstract service. Service classes provides access to stored entities.
 * @abstract
 * @class Service
 * @param {Object} storage - SgStorage instance
 * @param {Object} [options] - Optional settings
 * @param {string} [options.prefix] - Prefix of keys service use
 * @param {string} [options.indices=[]] - Name of index keys
 * @param {string} [options.entity] - Name of entity
 */
'use strict'

const {EventEmitter} = require('events')
const asleep = require('asleep')
const assert = require('assert')
const sgQueue = require('sg-queue')
const entities = require('../entities')

let isEmpty = (value) => value === null || typeof value === 'undefined'

class Service extends EventEmitter {
  constructor (storage, options = {}) {
    super()

    const s = this
    s.storage = storage
    s.Entity = entities[options.entity || 'Entity']
    s.prefix = options.prefix || 'sg'
    s.indices = [].concat(options.indices || [])

    s.hkeyForEntities = () => `${s.prefix}:entities`
    s.hkeyForIndices = (index) => `${s.prefix}:indices:${index}`

    s.setMaxListeners(Infinity)
    s.queue = sgQueue()
  }

  /**
   * Save entity to storage
   * @param {Entity} entity - Entity to save
   * @returns {Promise}
   */
  async save (entity) {
    const s = this
    let {storage, queue} = s
    let {key} = entity
    await queue.push(async () => {
      await storage.hset(s.hkeyForEntities(), key, JSON.stringify(entity))
      for (let index of s.indices) {
        await storage.hset(s.hkeyForIndices(index), entity[index], key)
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
  async find (key, options = {}) {
    const s = this
    let {Entity} = s
    let {
      retryMax = 3,
      retryInterval = 33
    } = options
    for (let i = 0; i < retryMax; i++) {
      const data = await s._entitiesWithKey(key)
      if (data) {
        return new Entity(JSON.parse(data))
      }
      await asleep(retryInterval)
    }
    if (options.strict) {
      throw new Error(`${Entity.$name || Entity.name} not found for key: ${JSON.stringify(key)}`)
    } else {
      return null
    }
  }

  /**
   * Find entity bin index.
   * @param {string} indexKey - Key of the index.
   * @param {string} indexValue - Value of the index
   * @param {Object} [options] - Find options
   * @returns {Promise.<Entity>}
   */
  async findByIndex (indexKey, indexValue, options = {}) {
    const s = this
    assert.ok(!!~s.indices.indexOf(indexKey))
    let key = await s._indicesWithKeyValue(indexKey, indexValue)
    let failed = options.strict && !key
    if (failed) {
      throw new Error(`Key not found with index ${indexKey}="${indexValue}"`)
    }
    return await s.find(key, options)
  }

  /**
   * Destroy entity
   * @param {string} key - Key of the entity
   * @returns {Promise.<number>}
   */
  async destroy (key) {
    const s = this
    const {storage} = s
    let entity = await s.find(key)
    if (!entity) {
      return 0
    }
    await storage.hdel(s.hkeyForEntities(), key)
    for (const index of s.indices) {
      await storage.hdel(s.hkeyForIndices(index), entity[index])
    }
    return 1
  }

  /**
   * Get info
   * @returns {Promise.<Object>}
   */
  async info () {
    const s = this
    const {storage} = s
    const result = []
    // TODO hgetall can be too large
    let data = await storage.hgetall(s.hkeyForEntities())
    data = data || {}
    for (let key of Object.keys(data)) {
      let entity = JSON.parse(data[key])
      result.push(entity)
    }
    return result
  }

  /**
   * Invalidate sockets
   * @param {function} validator
   * @param {function} onDestroy
   * @returns {Promise}
   */
  async invalidate (validator, onDestroy) {
    const s = this
    let entries = await s.info()
    let result = {}
    for (let entry of entries) {
      let {key} = entry
      let valid = validator(entry)
      if (!valid) {
        result[key] = entry
        await s.destroy(key)
        if (onDestroy) {
          onDestroy(key)
        }
      }
    }
    return result
  }

  /**
   * Get indices with key and value
   * @param indexKey
   * @param indexValue
   * @returns {Promise}
   * @private
   */
  async _indicesWithKeyValue (indexKey, indexValue) {
    const s = this
    let {storage} = s
    if (isEmpty(indexValue)) {
      return null
    }
    return storage.hget(s.hkeyForIndices(indexKey), indexValue)
  }

  /**
   * Get entities with key
   * @param {string} key
   * @returns {Promise}
   * @private
   */
  async _entitiesWithKey (key) {
    const s = this
    let {storage} = s
    if (isEmpty(key)) {
      return null
    }
    return storage.hget(s.hkeyForEntities(), key)
  }
}

module.exports = Service
