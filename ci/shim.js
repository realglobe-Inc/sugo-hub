#!/usr/bin/env node

/**
 * Generate shim scripts
 */

'use strict'

process.chdir(`${__dirname}/..`)

const apeTasking = require('ape-tasking')
const ababelES2015 = require('ababel-es2015')

apeTasking.runTasks('shim', [
  async () => {
    const patterns = ['agent.js', 'constants.js']
    for (const pattern of patterns) {
      await ababelES2015(pattern, {
        cwd: 'lib',
        out: 'shim/browser'
      })
    }
  }
], true)
