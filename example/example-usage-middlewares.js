#!/usr/bin/env node

/**
 * This is an example to setup hub server with middlewares
 */

'use strict'

const sugoHub = require('sugo-hub')

async function tryMiddleareExample () {
  let hub = sugoHub({
    storage: { /* ... */ },
    // HTTP route handler with koa
    endpoints: { /* ... */ },
    // Custom koa middlewares
    middlewares: [
      async function customMiddleware (ctx, next) {
        /* ... */
        await next()
      }
    ],
    // Directory names to server static files
    static: [
      'public'
    ]
  })

  await hub.listen(3000)

  console.log(`SUGO Cloud started at port: ${hub.port}`)
}
tryMiddleareExample().catch((err) => console.error(err))
