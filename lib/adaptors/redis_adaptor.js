/**
 * Define redis adaptor for sockets
 * @function redisAdaptor
 */
'use strict'

const {parse: parseUrl} = require('url')
const {createClient} = require('redis')
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
    password = parsed.auth ? parsed.auth.split(':')[1] : undefined
  }
  const key = `${prefix}:socket.io`
  const pubClient = createClient(port, host, {password})
  const subClient = createClient(port, host, {password})
  const adaptor = socketIORedis({
    key,
    pubClient,
    subClient,
    requestsTimeout
  })
  io.adapter(adaptor)

  const close = async () => {
    pubClient.quit()
    subClient.quit()
  }

  return Object.assign(close, {close})
}

module.exports = redisAdaptor
