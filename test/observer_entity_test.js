/**
 * Test case for observerEntity.
 * Runs with mocha.
 */
'use strict'

const ObserverEntity = require('../lib/entities/observer_entity.js')
const assert = require('assert')
const co = require('co')

describe('observer-entity', () => {
  before(() => co(function * () {

  }))

  after(() => co(function * () {

  }))

  it('Observer entity', () => co(function * () {
    let entity = new ObserverEntity({
      key: '123456'
    })
    assert.ok(entity.key)
  }))
})

/* global describe, before, after, it */
