/**
 * Test case for actorEndpoint.
 * Runs with mocha.
 */
'use strict'

const ActorEndpoint = require('../lib/endpoints/actor_endpoint.js')
const assert = require('assert')


describe('actor-endpoint', () => {
  before(async () => {

  })

  after(async () => {

  })

  it('Actor endpoint', async () => {
    let endpoint = new ActorEndpoint()
    assert.ok(endpoint)
  })
})

/* global describe, before, after, it */
