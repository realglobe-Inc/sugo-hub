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
    requestsTimeout = 1000
  } = options
  let auth = ''
  if (url) {
    let parsed = parseUrl(url)
    host = parsed.hostname || host
    port = parsed.port || port
    auth = parsed.auth ? parsed.auth.split(':')[ 1 ] : ''
  }
  let pub = createClient(port, host, { auth_pass: auth })
  let sub = createClient(port, host, { auth_pass: auth, return_buffers: true })
  let adaptor = socketIORedis({
    pubClient: pub,
    subClient: sub,
    key: `${prefix}:socket.io`,
    requestsTimeout
  })
  io.adapter(adaptor)
}

module.exports = redisAdaptor
