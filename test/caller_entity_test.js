/**
 * Test case for terminalEntity.
 * Runs with mocha.
 */
'use strict'

const CallerEntity = require('../lib/entities/caller_entity.js')
const assert = require('assert')
const co = require('co')

describe('terminal-entity', () => {
  before(() => co(function * () {

  }))

  after(() => co(function * () {

  }))

  it('Terminal entity', () => co(function * () {
    let entity = new CallerEntity({ key: 'hoge' })
    entity.addActor({ key: 's1' })
    entity.addActor({ key: 's2' })
    entity.addActor({ key: 's3' })
    entity.removeActor({ key: 's2' })
    assert.deepEqual(entity.actors, [ 's1', 's3' ])
  }))
})

/* global describe, before, after, it */
