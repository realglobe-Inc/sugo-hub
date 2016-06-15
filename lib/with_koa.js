/**
 * Sugo cloud server with koa framework
 * @function withKoa
 * @param {Object} [options] - Optional settings
 * @param {function[]} [options.middlewares] - Middlewares to use
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
function withKoa (options = {}) {
  let { storage, port, keys, context, onError, middlewares } = options
  const koa = new Koa()
  middlewares = [].concat(middlewares || []).reduce((a, b) => [].concat(a, b), [])
  for (let middleware of middlewares) {
    koa.use(middleware)
  }
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
