/**
 * Test case for observerEntity.
 * Runs with mocha.
 */
'use strict'

const ObserverEntity = require('../lib/entities/observer_entity.js')
const assert = require('assert')


describe('observer-entity', () => {
  before(async () => {

  })

  after(async () => {

  })

  it('Observer entity', async () => {
    let entity = new ObserverEntity({
      key: '123456'
    })
    assert.ok(entity.key)
  })
})

/* global describe, before, after, it */
