/**
 * Abstract service
 * @abstract
 * @class Service
 * @param {Object} storage - SgStorage instance
 * @param {Object} [options] - Optional settings
 * @param {string} [options.prefix] - Prefix of keys service use
 */
'use strict'

const { EventEmitter } = require('events')
const co = require('co')

const { AcknowledgeStatus } = require('sg-socket-constants')
const { OK, NG } = AcknowledgeStatus

let ok = (payload) => ({ status: OK, payload })
let ng = (payload) => ({ status: NG, payload })

class Service extends EventEmitter {
  constructor (storage, options = {}) {
    super()
    const s = this
    s.storage = storage
    s.sockets = {}

    s.prefix = options.prefix || 'sg'
  }

  /**
   * Handle and callback as socket.IO acknowledge
   * @param {function} handler - Data handler function
   * @returns {function}
   */
  ack (handler) {
    return co.wrap(function * ackImpl (data, callback) {
      try {
        let result = yield Promise.resolve(handler(data))
        callback(ok(result))
      } catch (err) {
        callback(ng(err && err.message || err))
      }
    })
  }
}

module.exports = Service
