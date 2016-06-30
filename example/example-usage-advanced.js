#!/usr/bin/env node

/**
 * This is an example to setup cloud server with advanced options
 */

'use strict'

const sugoCloud = require('sugo-cloud')

const co = require('co')

co(function * () {
  let cloud = yield sugoCloud({
    port: 3000,
    // HTTP route handler with koa
    endpoints: {
      '/api/user/:id': {
        'GET': (ctx) => {
          let { id } = ctx.params
          /* ... */
          ctx.body = { /* ... */ }
        }
      }
    },
    // Custom koa middlewares
    middlewares: [
      co.wrap(function * customMiddleware (ctx, next) {
        /* ... */
        yield next()
      })
    ],
    // Directory to server static files
    public: [
      'public'
    ],
    // Using redis server as storage
    storage: {
      // Redis setup options (see https://github.com/NodeRedis/node_redis)
      redis: {
        host: '127.0.0.1',
        port: '6379',
        db: 1
      }
    }
  })

  console.log(`SUGO Cloud started at port: ${cloud.port}`)

  return cloud
}).catch((err) => console.error(err))
