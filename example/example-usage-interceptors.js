#!/usr/bin/env node

/**
 * This is an example to setup hub server with interceptors
 */

'use strict'

const sugoHub = require('sugo-hub')
const { ACTOR_URL, CALLER_URL, OBSERVER_URL } = sugoHub

const co = require('co')

co(function * () {
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

  yield hub.listen(3000)

  console.log(`SUGO Cloud started at port: ${hub.port}`)
}).catch((err) => console.error(err))
