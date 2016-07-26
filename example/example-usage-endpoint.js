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
    // Using redis server as storage
    storage: { /* ... */ },
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
    middlewares: [ /* ... */ ],
    // Directory names to server static files
    static: [ /* ... */ ]
  })

  console.log(`SUGO Cloud started at port: ${cloud.port}`)
}).catch((err) => console.error(err))
