#!/usr/bin/env node

/**
 * This is an example to setup hub server with redis
 */

'use strict'

const sugoHub = require('sugo-hub')

async function tryRedisExample () {
  let hub = sugoHub({
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

  await hub.listen(3000)

  console.log(`SUGO Cloud started at port: ${hub.port}`)
}
tryRedisExample().catch((err) => console.error(err))
