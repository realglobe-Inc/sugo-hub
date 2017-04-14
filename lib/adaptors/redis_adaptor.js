/**
 * Define redis adaptor for sockets
 * @function redisAdaptor
 */
'use strict'

const { parse: parseUrl } = require('url')
const { createClient } = require('redis')
const socketIORedis = require('socket.io-redis')

/** @lends redisAdaptor */
function redisAdaptor (io, options = {}) {
  let {
    url,
    host,
    port,
    prefix,
    password,
    requestsTimeout = 1000
  } = options
  if (url) {
    let parsed = parseUrl(url)
    host = parsed.hostname || host
    port = parsed.port || port
    password = parsed.auth ? parsed.auth.split(':')[ 1 ] : undefined
  }
  let key = `${prefix}:socket.io`
  let pubClient = createClient(port, host, { password })
  let subClient = createClient(port, host, { password })
  let adaptor = socketIORedis({
    key,
    pubClient,
    subClient,
    requestsTimeout
  })
  io.adapter(adaptor)
}

module.exports = redisAdaptor
