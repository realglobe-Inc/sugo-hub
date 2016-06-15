/**
 * Sugo cloud server with koa framework
 * @function withKoa
 * @param {function[]} middlewares - Middlewares to use
 * @param {Object} [options] - Optional settings
 * @param {number} [options.port=3000] - Port number to run
 * @param {string|Object} [options.storage] -  Storage options
 * @param {string} [options.keys] - Koa keys
 * @param {Object} [options.context] - Koa context prototype
 * @param {function} [options.onError] - Error handler
 * @see https://github.com/koajs/koa#readme
 */
'use strict'

const Koa = require('koa')
const KoaRouter = require('koa-router')
const http = require('http')
const sugoCloud = require('./sugo_cloud')

/** @lends withKoa */
function withKoa (middlewares, options = {}) {
  const koa = new Koa()
  for (let middleware of [].concat(middlewares || [])) {
    koa.use(middleware)
  }
  let { storage, port, keys, context, onError } = options
  port = port || 3000
  if (keys) {
    koa.keys = keys
  }
  if (context) {
    Object.assign(koa.context, context)
  }
  if (onError) {
    koa.on('error', onError)
  }
  let server = http.createServer(koa.callback()).listen(port)
  return sugoCloud({
    port, server, storage
  })
}

Object.assign(withKoa, {
  Router: KoaRouter
})

module.exports = withKoa
