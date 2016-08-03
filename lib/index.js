/**
 * Cloud server of SUGOS
 * @module sugo-hub
 */

'use strict'

const sugoHub = require('./sugo_hub')

let lib = sugoHub.bind(this)

Object.assign(lib, sugoHub, {
  sugoHub
})

module.exports = lib
