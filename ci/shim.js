#!/usr/bin/env node

/**
 * Generate shim scripts
 */

'use strict'

process.chdir(`${__dirname}/..`)

const apeTasking = require('ape-tasking')
const co = require('co')
const ababelES2015 = require('ababel-es2015')

apeTasking.runTasks('shim', [
  () => co(function * () {
    let patterns = [ 'agent.js', 'constants.js' ]
    for (let pattern of patterns) {
      yield ababelES2015(pattern, {
        cwd: 'lib',
        out: 'shim/browser'
      })
    }
  })
], true)
