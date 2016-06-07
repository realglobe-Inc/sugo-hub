/**
 * Test case for entity.
 * Runs with mocha.
 */
'use strict'

const Entity = require('../lib/entities/entity.js')
const assert = require('assert')
const co = require('co')

describe('entity', () => {
  before(() => co(function * () {

  }))

  after(() => co(function * () {

  }))

  it('Entity', () => co(function * () {
    let entity = new Entity({ foo: 'bar' })
    assert.ok(entity)
    assert.equal(entity.foo, 'bar')
    entity.del('foo')
    assert.equal(typeof entity.foo, 'undefined')
  }))
})

/* global describe, before, after, it */
