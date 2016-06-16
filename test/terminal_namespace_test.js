/**
 * Test case for terminalNamespace.
 * Runs with mocha.
 */
'use strict'

const TerminalNamespace = require('../lib/namespaces/terminal_namespace.js')
const assert = require('assert')
const co = require('co')

describe('terminal-namespace', () => {
  before(() => co(function * () {

  }))

  after(() => co(function * () {

  }))

  it('Terminal namespace', () => co(function * () {
    let namespace = new TerminalNamespace()
    assert.ok(namespace)
  }))
})

/* global describe, before, after, it */
