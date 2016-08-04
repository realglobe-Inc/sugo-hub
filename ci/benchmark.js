#!/usr/bin/env

/**
 * Run benchmark tests
 */
'use strict'

process.chdir(`${__dirname}/..`)

const { runTasks, execcli } = require('ape-tasking')

runTasks('benchmark', [
  () => execcli('benchmark/connect_benchmark.js')
], true)
