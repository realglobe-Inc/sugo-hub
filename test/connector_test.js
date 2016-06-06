/**
 * Test case for connector.
 * Runs with mocha.
 */
'use strict'

const Connector = require('../lib/connectors/connector.js')
const assert = require('assert')
const co = require('co')

describe('connector', () => {
  before(() => co(function * () {

  }))

  after(() => co(function * () {

  }))

  it('Connector', () => co(function * () {
    assert.ok(Connector)
  }))
})

/* global describe, before, after, it */
