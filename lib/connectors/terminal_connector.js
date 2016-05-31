/**
 * @augments EventEmitter
 * @class TerminalConnect
 */
'use strict'

const co = require('co')
const { EventEmitter } = require('events')

class TerminalConnect extends EventEmitter {
  constructor (storage) {
    super()

    const s = this
    s.storage = storage
    s.spots = {}
    s.onError = (err) => s.emit(err) || Promise.reject(err)
  }
}

module.exports = TerminalConnect
