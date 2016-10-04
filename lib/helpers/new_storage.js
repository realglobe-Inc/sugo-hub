/**
 * Create a new storage
 * @param {Object|string} config - Storage config
 * @function newStorage
 */
'use strict'

const sgStorage = require('sg-storage')
const { execSync } = require('child_process')

/** @lends newStorage */
function newStorage (config) {
  if (config.redis) {
    let redisVersion = newStorage.redisVersion()
    if (redisVersion) {
      let [major] = redisVersion.split(/\./g)
      if (Number(major) < 3) {
        throw new Error(`[SUGO-Hub] Redis version should be 3.x or later, but given: ${redisVersion}`)
      }
    }
    return sgStorage.redis(config.redis)
  }
  console.warn(`
[SUGO-Hub][warning] SHOULD USE REDIS SERVER. You are using file system storage, which is relatively slow.    
Please consider use redis options. ( See https://github.com/realglobe-Inc/sugo-hub#using-redis-server )
`)
  return sgStorage(config)
}

Object.assign(newStorage, {
  redisVersion () {
    try {
      let components = execSync('redis-server -v').toString().split(' ')
      let [, version] = components.filter((component) => /^v=/.test(component)).shift().split('=')
      return version
    } catch (e) {
      console.log(e)
      // DO nothing
      return null
    }
  }
})

module.exports = newStorage
