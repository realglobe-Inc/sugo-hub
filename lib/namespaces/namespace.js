/**
 * Handle for socket.io namespace
 * @class Namespace
 */
'use strict'

const s = this

const co = require('co')
const { isProduction } = require('asenv')

const { AcknowledgeStatus } = require('sg-socket-constants')
const debug = require('debug')('hub:namespace')
const { OK, NG } = AcknowledgeStatus

let ok = (payload, meta) => ({ status: OK, payload, meta })
let ng = (payload, meta) => ({ status: NG, payload, meta })

/** @lends Namespace */
class Namespace {
  constructor () {
    const s = this
  }

  handleConnection (socket, scope) {
    throw new Error('Not implemented')
  }

  /**
   * Handle and callback as socket.IO acknowledge
   * @param {function} handler - Data handler function
   * @returns {function}
   */
  ack (handler) {
    return co.wrap(function * ackImpl (data, callback) {
      try {
        let [payload, meta] = yield Promise.resolve(co(handler(data)))
        callback(ok(payload, meta))
      } catch (thrown) {
        let err = thrown
        if (typeof err === 'string') {
          err = { name: 'UnExpectedError', message: err }
        }
        let { name, message, stack } = err || {}
        debug('Ack error', message, stack)
        if (isProduction()) {
          stack = undefined
        }
        callback(ng({ name, message, stack }))
      }
    })
  }

  killSocket (socket) {
    socket && socket.disconnect()
  }

  handleError (err) {
    // TODO
    console.error(err)
  }
}

module.exports = Namespace
