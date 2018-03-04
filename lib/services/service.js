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

    this.storage = storage
    this.Entity = entities[options.entity || 'Entity']
    this.prefix = options.prefix || 'sg'
    this.indices = [].concat(options.indices || [])

    this.hkeyForEntities = () => `${this.prefix}:entities`
    this.hkeyForIndices = (index) => `${this.prefix}:indices:${index}`

    this.setMaxListeners(Infinity)
    this.queue = sgQueue()
  }

  /**
   * Save entity to storage
   * @param {Entity} entity - Entity to save
   * @returns {Promise}
   */
  async save (entity) {
    const {storage, queue} = this
    const {key} = entity
    await queue.push(async () => {
      await storage.hset(this.hkeyForEntities(), key, JSON.stringify(entity))
      for (let index of this.indices) {
        await storage.hset(this.hkeyForIndices(index), entity[index], key)
      }
    })
  }

  /**
   * Get entity by key
   * @param {string} key - Key of the entity
   * @param {Object} [options={}] - Optional settings
   * @param {boolean} [options.strict] - Throw error if not found
   * @returns {Promise.<Service.Entity>}
   */
  async find (key, options = {}) {
    const {Entity} = this
    const {
      retryMax = 3,
      retryInterval = 33
    } = options
    for (let i = 0; i < retryMax; i++) {
      const data = await this._entitiesWithKey(key)
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
    assert.ok(!!~this.indices.indexOf(indexKey))
    const key = await this._indicesWithKeyValue(indexKey, indexValue)
    const failed = options.strict && !key
    if (failed) {
      throw new Error(`Key not found with index ${indexKey}="${indexValue}"`)
    }
    return await this.find(key, options)
  }

  /**
   * Destroy entity
   * @param {string} key - Key of the entity
   * @returns {Promise.<number>}
   */
  async destroy (key) {
    const {storage} = this
    let entity = await this.find(key)
    if (!entity) {
      return 0
    }
    await storage.hdel(this.hkeyForEntities(), key)
    for (const index of this.indices) {
      await storage.hdel(this.hkeyForIndices(index), entity[index])
    }
    return 1
  }

  /**
   * Get info
   * @returns {Promise.<Object>}
   */
  async info () {
    const {storage} = this
    const result = []
    // TODO hgetall can be too large
    let data = await storage.hgetall(this.hkeyForEntities())
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
    let entries = await this.info()
    let result = {}
    for (let entry of entries) {
      let {key} = entry
      let valid = validator(entry)
      if (!valid) {
        result[key] = entry
        await this.destroy(key)
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
    let {storage} = this
    if (isEmpty(indexValue)) {
      return null
    }
    return storage.hget(this.hkeyForIndices(indexKey), indexValue)
  }

  /**
   * Get entities with key
   * @param {string} key
   * @returns {Promise}
   * @private
   */
  async _entitiesWithKey (key) {
    const {storage} = this
    if (isEmpty(key)) {
      return null
    }
    const closing = storage.client && storage.client.closing
    if (closing) {
      return null
    }
    return storage.hget(this.hkeyForEntities(), key)
  }
}

module.exports = Service
