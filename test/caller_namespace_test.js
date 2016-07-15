/**
 * Test case for callerNamespace.
 * Runs with mocha.
 */
'use strict'

const CallerNamespace = require('../lib/namespaces/caller_namespace.js')
const assert = require('assert')
const co = require('co')

describe('terminal-namespace', () => {
  before(() => co(function * () {

  }))

  after(() => co(function * () {

  }))

  it('Terminal namespace', () => co(function * () {
    let namespace = new CallerNamespace()
    assert.ok(namespace)
  }))
})

/* global describe, before, after, it */
