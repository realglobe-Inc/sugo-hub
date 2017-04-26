#!/usr/bin/env node

/**
 * This is an example to setup hub server with aut
 */

'use strict'

const sugoHub = require('sugo-hub')

async function tryAuthExample () {
  let hub = sugoHub({
    storage: { /* ... */ },
    endpoints: { /* ... */ },
    /**
     * Auth function
     * @param {Object} socket - A socket connecting
     * @param {Object} data - Socket auth data
     * @returns {Promise.<boolean>} - OK or not
     */
    authenticate (socket, data) {
      let tokenStates = { /* ... */ }
      let ok = !!tokenStates[ data.token ]
      return Promise.resolve(ok)
    },
    middlewares: [ /* ... */ ],
    static: [ /* ... */ ]
  })

  await hub.listen(3000)

  console.log(`SUGO Cloud started at port: ${hub.port}`)
}

tryAuthExample().catch((err) => console.error(err))
