#!/usr/bin/env node

/**
 * This is an example to setup hub server
 */

'use strict'

const sugoHub = require('sugo-hub')

async function tryExample () {
  // Start sugo-hub server
  let hub = sugoHub({
    // Options here
  })

  await hub.listen(3000)

  console.log(`SUGO Cloud started at port: ${hub.port}`)
}

tryExample().catch((err) => console.error(err))
