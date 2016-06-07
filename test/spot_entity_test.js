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
    entity.addTerminal({ key: 's1' })
    entity.addTerminal({ key: 's2' })
    entity.addTerminal({ key: 's3' })
    entity.removeTerminal({ key: 's2' })
    assert.deepEqual(entity.terminals, [ 's1', 's3' ])
  }))
})

/* global describe, before, after, it */
