#!/usr/bin/env node

/**
 * This is an example to setup hub server with local actors
 */

'use strict'

const sugoHub = require('sugo-hub')
const sugoActor = require('sugo-actor')

async function tryLocalExample () {
  let hub = sugoHub({
    storage: { /* ... */ },
    endpoints: { /* ... */ },
    middlewares: [ /* ... */ ],
    static: [ /* ... */ ],

    /**
     * Local actors for the hub
     * @type {Object<string, SugoActor>}
     */
    localActors: {
      'my-actor-01': sugoActor({
        modules: {
          say: {
            sayYes: () => 'Yes from actor01'
          }
        }
      })
    }
  })

  // Local actors automatically connect to the hub when it start listening
  await hub.listen(3000)

  console.log(`SUGO Cloud started at port: ${hub.port}`)
}

tryLocalExample().catch((err) => console.error(err))
