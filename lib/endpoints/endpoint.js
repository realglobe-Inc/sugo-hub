/**
 * Abstract endpoint
 * @class Endpoint
 */
'use strict'

const co = require('co')

/** @lends Endpoint */
class Endpoint {
  constructor (scope) {
    const s = this
    s.scope = scope
  }
}

Object.assign(Endpoint, {})

module.exports = Endpoint