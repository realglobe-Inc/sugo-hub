/**
 * Create a new storage
 * @param {Object|string} config - Storage config
 * @function newStorage
 */
'use strict'

const sgStorage = require('sg-storage')

/** @lends newStorage */
function newStorage (config) {
  if (config.redis) {
    return sgStorage.redis(config.redis)
  }
  if (config.custom) {
    return config.custom
  }
  console.warn(`
[SUGO-Hub][warning] SHOULD USE REDIS SERVER. You are using file system storage, which is relatively slow.    
Please consider use redis options. ( See https://github.com/realglobe-Inc/sugo-hub#using-redis-server )
`)
  return sgStorage(config)
}

module.exports = newStorage
