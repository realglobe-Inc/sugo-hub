#!/usr/bin/env node

/**
 * This is an example to setup hub server with local actors
 */

'use strict'

const sugoHub = require('sugo-hub')
const sugoActor = require('sugo-actor')

const co = require('co')

co(function * () {
  let hub = sugoHub({
    storage: { /* ... */ },
    endpoints: { /* ... */ },
    middlewares: [ /* ... */ ],
    static: [ /* ... */ ],

    /**
     * Local actors for the hub
     */
    localActors: {
      actor01: sugoActor({
        key: 'my-actor-01',
        modules: {
          say: {
            sayYes: () => 'Yes from actor01'
          }
        }
      })
    }
  })

  // Local actors automatically connect to the hub when it start listening
  yield hub.listen(3000)

  console.log(`SUGO Cloud started at port: ${hub.port}`)
}).catch((err) => console.error(err))
