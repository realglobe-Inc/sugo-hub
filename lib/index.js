/**
 * Cloud server of SUGOS
 * @module sugo-cloud
 */

'use strict'

const sugoCloud = require('./sugo_cloud')
const withKoa = require('./with_koa')

let lib = sugoCloud.bind(this)

Object.assign(lib, sugoCloud, {
  sugoCloud,
  withKoa
})

module.exports = lib