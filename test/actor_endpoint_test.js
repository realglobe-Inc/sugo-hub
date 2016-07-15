/**
 * Test case for actorEndpoint.
 * Runs with mocha.
 */
'use strict'

const ActorEndpoint = require('../lib/endpoints/actor_endpoint.js')
const assert = require('assert')
const co = require('co')

describe('actor-endpoint', () => {
  before(() => co(function * () {

  }))

  after(() => co(function * () {

  }))

  it('Actor endpoint', () => co(function * () {
    let endpoint = new ActorEndpoint()
  }))
})

/* global describe, before, after, it */
