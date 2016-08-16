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

  console.log(`SUGO Cloud started at port: ${cloud.port}`)
}).catch((err) => console.error(err))
