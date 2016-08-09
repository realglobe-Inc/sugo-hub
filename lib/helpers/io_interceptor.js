/**
 * Compose multiple socket io middleware into one
 * @function ioInterceptor
 * @param {function} handlers
 * @returns {function}
 */
'use strict'

const co = require('co')

/** @lends ioInterceptor */
function ioInterceptor (handlers = []) {
  return function composedMiddleware (socket, next) {
    return co(function * () {
      for (let handler of [].concat(handlers || [])) {
        yield Promise.resolve(handler(socket))
      }
    })
      .then(() => next())
      .catch((err) => next(err))
  }
}

module.exports = ioInterceptor
