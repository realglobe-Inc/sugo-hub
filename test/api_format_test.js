/**
 * Test case for apiFormat.
 * Runs with mocha.
 */
'use strict'

const ApiFormat = require('../lib/helpers/api_format.js')
const assert = require('assert')
const { ActorEntity, CallerEntity, ObserverEntity } = require('../lib/entities')
const co = require('co')

describe('api-format', () => {
  before(() => co(function * () {

  }))

  after(() => co(function * () {

  }))

  it('Api format', () => co(function * () {
    assert.ok(ApiFormat.resourceType(ActorEntity), 'actors')
    assert.ok(ApiFormat.resourceType(CallerEntity), 'callers')
    assert.ok(ApiFormat.resourceType(ObserverEntity), 'observers')
  }))
})

/* global describe, before, after, it */
