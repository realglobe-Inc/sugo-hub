/**
 * Adaptor for auth
 * @function authAdaptor
 */
'use strict'

const socketIOAuth = require('socketio-auth')

/** @lends authAdaptor */
function authAdaptor (io, options = {}) {
  let { authenticate } = options
  let authenticateCall = (socket, data, callback) => {
    Promise.resolve(authenticate(socket, data))
      .then((result) => callback(null, result))
      .catch((err) => callback(err))
  }

  socketIOAuth(io, { authenticate: authenticateCall })
}

module.exports = authAdaptor
