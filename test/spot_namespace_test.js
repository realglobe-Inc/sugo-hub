/**
 * Test case for spotNamespace.
 * Runs with mocha.
 */
'use strict'

const SpotNamespace = require('../lib/namespaces/spot_namespace.js')
const assert = require('assert')
const co = require('co')

describe('spot-namespace', () => {
  before(() => co(function * () {

  }))

  after(() => co(function * () {

  }))

  it('Spot namespace', () => co(function * () {
    let namespace = new SpotNamespace()
    assert.ok(namespace)
  }))
})

/* global describe, before, after, it */
