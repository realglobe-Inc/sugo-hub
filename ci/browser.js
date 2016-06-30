#!/usr/bin/env node

/**
 * Compile to browser source
 */

'use strict'

process.chdir(`${__dirname}/..`)

const apeTasking = require('ape-tasking')
const apeCompiling = require('ape-compiling')
const co = require('co')
const filedel = require('filedel')

apeTasking.runTasks('browser', [
  () => filedel('sims/browser/**/*.js'),
  () => co(function * () {
    let patterns = [ 'agent.js', 'constants/*.js' ]
    for (let pattern of patterns) {
      yield apeCompiling.compileToEs5(pattern, {
        cwd: 'lib',
        out: 'sims/browser'
      })
    }
  })
], true)
