/**
 * Create a hub instance. Just an alias of `new SugoHub(config)`
 * @function sugoHub
 * @returns {SugoHub}  - A SugoHub instance
 * @example

 ;(async () => {
  const hub = sugoHub({
  // Options here
  })
  await hub.listen(3000)
}).catch((err) => console.error(err))

 */
'use strict'

const SugoHub = require('./sugo_hub')

/** @lends sugoHub */
function create (...args) {
  return new SugoHub(...args)
}

module.exports = create
