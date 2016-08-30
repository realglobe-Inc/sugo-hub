#!/usr/bin/env node

/**
 * This is an example to setup cloud server with advanced options
 */

'use strict'

const sugoHub = require('sugo-hub')

const co = require('co')

co(function * () {
  let hub = sugoHub({
    storage: { /* ... */ },
    // HTTP route handler with koa
    endpoints: { /* ... */ },
    // Custom koa middlewares
    middlewares: [
      co.wrap(function * customMiddleware (ctx, next) {
        /* ... */
        yield next()
      })
    ],
    // Directory names to server static files
    static: [
      'public'
    ]
  })

  yield hub.listen(3000)

  console.log(`SUGO Cloud started at port: ${hub.port}`)
}).catch((err) => console.error(err))
