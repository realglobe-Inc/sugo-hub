/**
 * Compose multiple socket io middleware into one
 * @function ioInterceptor
 * @param {function} handlers
 * @returns {function}
 */
'use strict'

/** @lends ioInterceptor */
function ioInterceptor (handlers = []) {
  return async function composedMiddleware (socket, next) {
    try {
      for (const handler of [].concat(handlers || [])) {
        await Promise.resolve(handler(socket))
      }
      next()
    } catch (err) {
      next(err)
    }
  }
}

module.exports = ioInterceptor
