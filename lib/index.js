/**
 * Hub server of SUGOS
 * @module sugo-hub
 * @version 8.2.2
 */

'use strict'

const SugoHub = require('./sugo_hub')
const create = require('./create')
const constants = require('./constants')

let lib = create.bind(this)

Object.assign(lib, SugoHub, constants, {
  SugoHub
})

module.exports = lib
