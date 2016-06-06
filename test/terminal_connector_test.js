/**
 * Test case for terminalConnector.
 * Runs with mocha.
 */
'use strict'

const TerminalConnector = require('../lib/connectors/terminal_connector.js')
const assert = require('assert')
const co = require('co')

describe('terminal-connector', () => {
  before(() => co(function * () {

  }))

  after(() => co(function * () {

  }))

  it('Terminal connector', () => co(function * () {
    assert.ok(TerminalConnector)
  }))
})

/* global describe, before, after, it */
