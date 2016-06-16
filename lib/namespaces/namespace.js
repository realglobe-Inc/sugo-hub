/**
 * Handle for socket.io namespace
 * @class Namespace
 */
'use strict'

const s = this

const co = require('co')
const { AcknowledgeStatus } = require('sg-socket-constants')
const { OK, NG } = AcknowledgeStatus

let ok = (payload) => ({ status: OK, payload })
let ng = (payload) => ({ status: NG, payload })

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
        let result = yield Promise.resolve(co(handler(data)))
        callback(ok(result))
      } catch (err) {
        callback(ng(err && err.message || err))
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
