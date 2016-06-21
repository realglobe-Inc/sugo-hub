/**
 * Hold sockets
 * @class SocketPool
 */
'use strict'

/** @lends SocketPool */
class SocketPool {
  broadcast (event, data) {
    const s = this
    for (let key of s) {
      let socket = s[ key ]
      socket.emit(event, data)
    }
  }
}

module.exports = SocketPool
