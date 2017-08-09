/**
 * Test case for spotEntity.
 * Runs with mocha.
 */
'use strict'

const ActorEntity = require('../lib/entities/actor_entity.js')
const assert = require('assert')


describe('actor-entity', () => {
  before(async () => {

  })

  after(async () => {

  })

  it('Actor entity', async () => {
    let entity = new ActorEntity({ key: 'bar' })
    assert.equal(entity.key, 'bar')
    entity.addCaller({ key: 's1' })
    entity.addCaller({ key: 's2' })
    entity.addCaller({ key: 's3' })
    entity.removeCaller({ key: 's2' })
    assert.deepEqual(entity.callers, [ 's1', 's3' ])
  })
})

/* global describe, before, after, it */
