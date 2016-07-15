/**
 * Test case for actorNamespace.
 * Runs with mocha.
 */
'use strict'

const ActorNamespace = require('../lib/namespaces/actor_namespace.js')
const assert = require('assert')
const co = require('co')

describe('actor-namespace', () => {
  before(() => co(function * () {

  }))

  after(() => co(function * () {

  }))

  it('Actor namespace', () => co(function * () {
    let namespace = new ActorNamespace()
    assert.ok(namespace)
  }))
})

/* global describe, before, after, it */
