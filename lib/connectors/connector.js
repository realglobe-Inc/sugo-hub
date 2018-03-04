/**
 * Handle for socket.io connector
 * @class Connector
 */
'use strict'

const {isProduction} = require('asenv')

const {AcknowledgeStatus} = require('sg-socket-constants')
const debug = require('debug')('hub:connector')
const {OK, NG} = AcknowledgeStatus

let ok = (payload, meta) => ({status: OK, payload, meta})
let ng = (payload, meta) => ({status: NG, payload, meta})

/** @lends Connector */
class Connector {
  constructor ({logger} = {}) {
    this.logger = logger
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
    return async function ackImpl (data, callback) {
      try {
        const [payload, meta] = await handler(data) || []
        process.nextTick(() =>
          callback(ok(payload, meta))
        )
      } catch (thrown) {
        let err = thrown
        if (typeof err === 'string') {
          err = {name: 'UnExpectedError', message: err}
        }
        let {name, message, stack} = err || {}
        debug('Ack error', message, stack)
        if (isProduction()) {
          stack = undefined
        }
        process.nextTick(() =>
          callback(ng({name, message, stack}))
        )
      }
    }
  }

  killSocket (socket) {
    socket && socket.disconnect()
  }

  handleError (err) {
    // TODO
    console.error(err)
  }
}

Connector.helpers = {
  ok, ng
}

module.exports = Connector
