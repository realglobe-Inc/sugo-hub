#!/usr/bin/env node

/**
 * This is an example to setup hub server
 */

'use strict'

const sugoHub = require('sugo-hub')

const co = require('co')

co(function * () {
  // Start sugo-hub server
  let hub = sugoHub({
    // Options here
  })

  yield hub.listen(3000)

  console.log(`SUGO Cloud started at port: ${hub.port}`)
}).catch((err) => console.error(err))
