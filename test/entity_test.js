/**
 * Test case for entity.
 * Runs with mocha.
 */
'use strict'

const Entity = require('../lib/entities/entity.js')
const assert = require('assert')


describe('entity', () => {
  before(async () => {

  })

  after(async () => {

  })

  it('Entity', async () => {
    let entity = new Entity({ key: 'bar' })
    assert.ok(entity)
    assert.equal(entity.key, 'bar')
    entity.del('key')
    assert.equal(typeof entity.key, 'undefined')
  })
})

/* global describe, before, after, it */
