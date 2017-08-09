/**
 * Test case for observerService.
 * Runs with mocha.
 */
'use strict'

const ObserverService = require('../lib/services/observer_service.js')
const assert = require('assert')


describe('observer-service', () => {
  before(async () => {

  })

  after(async () => {

  })

  it('Observer service', async () => {
    let service = new ObserverService()
    assert.ok(service)
  })
})

/* global describe, before, after, it */
