/**
 * Create a hub instance. Just an alias of `new SugoCaller(config)`
 * @function sugoHub
 * @returns {Promise.<SugoHub>}  - A SugoHub instance
 * @example

 co(function * () {
  let cloud = sugoHub({
  // Options here
  })
  yield hub.listen(3000)
}).catch((err) => console.error(err))

 */
'use strict'

const SugoHub = require('./sugo_hub')

/** @lends sugoHub */
function create (...args) {
  return new SugoHub(...args)
}

module.exports = create
