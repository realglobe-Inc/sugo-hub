#!/usr/bin/env node

/**
 * Setup cloud server
 */

'use strict'

const sugoCloud = require('sugo-cloud')

// Start sugo-cloud server
sugoCloud({
  // Options
  port: 3000
})
