/**
 * Pool classes
 * @module pools
 */

'use strict'

let d = (module) => module.default || module

module.exports = {
  get SocketPool () { return d(require('./socket_pool')) }
}
