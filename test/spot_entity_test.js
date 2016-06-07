/**
 * Test case for spotEntity.
 * Runs with mocha.
 */
'use strict'

const SpotEntity = require('../lib/entities/spot_entity.js')
const assert = require('assert')
const co = require('co')

describe('spot-entity', () => {
  before(() => co(function * () {

  }))

  after(() => co(function * () {

  }))

  it('Spot entity', () => co(function * () {
    let entity = new SpotEntity({ key: 'bar' })
    assert.equal(entity.key, 'bar')
  }))
})

/* global describe, before, after, it */
