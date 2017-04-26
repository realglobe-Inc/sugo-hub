#!/usr/bin/env node

/**
 * This is an example to setup hub server with interceptors
 */

'use strict'

const sugoHub = require('sugo-hub')
const { ACTOR_URL, CALLER_URL, OBSERVER_URL } = sugoHub

async function tryInterceptorExample () {
  let hub = sugoHub({
    storage: { /* ... */ },
    endpoints: { /* ... */ },
    // Interceptor for web socket connections
    interceptors: {
      [ACTOR_URL]: [],
      [CALLER_URL]: [],
      [OBSERVER_URL]: []
    },
    middlewares: [ /* ... */ ],
    static: [ /* ... */ ]
  })

  await hub.listen(3000)

  console.log(`SUGO Hub started at port: ${hub.port}`)
}

tryInterceptorExample().catch((err) => console.error(err))
