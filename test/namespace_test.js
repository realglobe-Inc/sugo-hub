/**
 * Test case for namespace.
 * Runs with mocha.
 */
'use strict'

const Namespace = require('../lib/namespaces/namespace.js')
const assert = require('assert')
const co = require('co')

describe('namespace', () => {
  before(() => co(function * () {

  }))

  after(() => co(function * () {

  }))

  it('Namespace', () => co(function * () {
    let namespace = new Namespace()
    assert.ok(namespace)
  }))
})

/* global describe, before, after, it */
