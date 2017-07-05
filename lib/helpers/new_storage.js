/**
 * Create a new storage
 * @param {Object|string} config - Storage config
 * @function newStorage
 */
'use strict'

const redis = require('redis')
const sgStorage = require('sg-storage')
const { execSync } = require('child_process')

/** @lends newStorage */
function newStorage (config) {
  if (config.redis) {
    newStorage.checkRedisVersion(config.redis)
    return sgStorage.redis(config.redis)
  }
  console.warn(`
[SUGO-Hub][warning] SHOULD USE REDIS SERVER. You are using file system storage, which is relatively slow.    
Please consider use redis options. ( See https://github.com/realglobe-Inc/sugo-hub#using-redis-server )
`)
  return sgStorage(config)
}

Object.assign(newStorage, {
  checkRedisVersion (redisConfig) {
    const redisClient = redis.createClient(redisConfig)
    redisClient.info((err, infoString) => {
      try {
        const pattern = /redis_version:\s*([0-9\.]+)\s*/
        const matched = infoString.match(pattern)
        const redisVersion = matched[1]
        if (redisVersion) {
          let [major] = redisVersion.split(/\./g)
          if (Number(major) < 3) {
            throw new Error(`[SUGO-Hub] Redis version should be 3.x or later, but given: ${redisVersion}`)
          }
        }
      } catch (e) {
        console.log(e)
        // DO nothing
        return null
      }
    })
  }
})

module.exports = newStorage
