#!/usr/bin/env node

/**
 * Generate shim scripts
 */

'use strict'

process.chdir(`${__dirname}/..`)

const apeTasking = require('ape-tasking')
const ababel = require('ababel')

apeTasking.runTasks('shim', [
  async () => {
    const patterns = ['agent.js', 'constants.js']
    for (const pattern of patterns) {
      await ababel(pattern, {
        cwd: 'lib',
        out: 'shim/browser'
      })
    }
  }
], true)
