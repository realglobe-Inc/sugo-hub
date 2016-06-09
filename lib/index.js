/**
 * Cloud server of SUGOS
 * @module sugo-cloud
 */

'use strict'

const sugoCloud = require('./sugo_cloud')

let lib = sugoCloud.bind(this)

Object.assign(lib, sugoCloud, {
  sugoCloud
})

module.exports = lib