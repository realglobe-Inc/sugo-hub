/**
 * Test case for apiFormat.
 * Runs with mocha.
 */
'use strict'

const ApiFormat = require('../lib/helpers/api_format.js')
const assert = require('assert')
const { ActorEntity, CallerEntity, ObserverEntity } = require('../lib/entities')


describe('api-format', () => {
  before(async () => {

  })

  after(async () => {

  })

  it('Api format', async () => {
    assert.ok(ApiFormat.resourceType(ActorEntity), 'actors')
    assert.ok(ApiFormat.resourceType(CallerEntity), 'callers')
    assert.ok(ApiFormat.resourceType(ObserverEntity), 'observers')
  })
})

/* global describe, before, after, it */
