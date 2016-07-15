/**
 * Test case for observerService.
 * Runs with mocha.
 */
'use strict'

const ObserverService = require('../lib/services/observer_service.js')
const assert = require('assert')
const co = require('co')

describe('observer-service', () => {
  before(() => co(function * () {

  }))

  after(() => co(function * () {

  }))

  it('Observer service', () => co(function * () {
    let service = new ObserverService()
    assert.ok(service)
  }))
})

/* global describe, before, after, it */
