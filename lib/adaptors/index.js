/**
 * Adaptors
 * @module Socket io adaptors
 */

'use strict'

let d = (module) => module && module.default || module

module.exports = {
  get authAdaptor () { return d(require('./auth_adaptor')) },
  get redisAdaptor () { return d(require('./redis_adaptor')) }
}
