#!/usr/bin/env node

/**
 * This is an example to setup hub server with endpoints
 */

'use strict'

const sugoHub = require('sugo-hub')

async function tryExample () {
  let hub = sugoHub({
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
    middlewares: [ /* ... */ ],
    static: [ /* ... */ ]
  })

  await hub.listen(3000)

  console.log(`SUGO Cloud started at port: ${hub.port}`)
}
tryExample().catch((err) => console.error(err))
