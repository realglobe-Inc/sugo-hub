/**
 * Create an instance
 * @function create
 * @returns {SugoHub}  - A SugoHub instance
 */
'use strict'

const SugoHub = require('./sugo_hub')

/** @lends create */
function create (...args) {
  let instance = new SugoHub(...args)
  return Promise.resolve(instance)
}

module.exports = create
