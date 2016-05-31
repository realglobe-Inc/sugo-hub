/**
 * Abstract connector
 * @class Connector
 */
'use strict'

const { EventEmitter } = require('events')

class Connector extends EventEmitter {
  constructor (storage) {
    super()
    const s = this
    s.storage = storage
  }
}

module.exports = Connector
