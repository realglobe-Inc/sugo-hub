#!/usr/bin/env node

/**
 * This is an example to setup cloud server with advanced options
 */

'use strict'

const sugoHub = require('sugo-hub')

const co = require('co')

co(function * () {
  let cloud = yield sugoHub({
    port: 3000,
    // Using redis server as storage
    storage: {
      // Redis setup options (see https://github.com/NodeRedis/node_redis)
      redis: {
        host: '127.0.0.1',
        port: '6379',
        db: 1
      }
    },
    endpoints: { /* ... */ },
    middlewares: [ /* ... */ ],
    static: [ /* ... */ ]
  })

  console.log(`SUGO Cloud started at port: ${cloud.port}`)
}).catch((err) => console.error(err))
