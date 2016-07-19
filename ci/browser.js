#!/usr/bin/env node

/**
 * Compile to browser source
 */

'use strict'

process.chdir(`${__dirname}/..`)

const apeTasking = require('ape-tasking')
const co = require('co')
const ababelES2015 = require('ababel-es2015')

apeTasking.runTasks('browser', [
  () => co(function * () {
    let patterns = [ 'agent.js', 'constants/*.js' ]
    for (let pattern of patterns) {
      yield ababelES2015(pattern, {
        cwd: 'lib',
        out: 'sims/browser'
      })
    }
  })
], true)
