/**
 * Adaptors
 * @module Socket io adaptors
 */

'use strict'

const d = (module) => module && module.default || module

const authAdaptor = d(require('./auth_adaptor'))
const redisAdaptor = d(require('./redis_adaptor'))

module.exports = {
  authAdaptor,
  redisAdaptor
}
