/**
 * Test case for observerNamespace.
 * Runs with mocha.
 */
'use strict'

const ObserverNamespace = require('../lib/namespaces/observer_namespace.js')
const assert = require('assert')
const co = require('co')

describe('observer-namespace', () => {
  before(() => co(function * () {

  }))

  after(() => co(function * () {

  }))

  it('Observer namespace', () => co(function * () {
    let namespace = new ObserverNamespace()
    assert.ok(namespace)
  }))
})

/* global describe, before, after, it */
