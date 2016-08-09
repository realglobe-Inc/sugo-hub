#!/usr/bin/env node

/**
 * This is an example to setup cloud server with interceptors
 */

'use strict'

const sugoHub = require('sugo-hub')
const { ACTOR_URL, CALLER_URL, OBSERVER_URL } = sugoHub

const co = require('co')

co(function * () {
  let cloud = yield sugoHub({
    port: 3000,
    // Using redis server as storage
    storage: { /* ... */ },
    // HTTP route handler with koa
    endpoints: { /* ... */ },
    // Interceptor for web socket connections
    interceptors: {
      [ACTOR_URL]: [],
      [CALLER_URL]: [],
      [OBSERVER_URL]: []
    },
    // Custom koa middlewares
    middlewares: [ /* ... */ ],
    // Directory names to server static files
    static: [ /* ... */ ]
  })

  console.log(`SUGO Cloud started at port: ${cloud.port}`)
}).catch((err) => console.error(err))
