/**
 * Test case for terminalEntity.
 * Runs with mocha.
 */
'use strict'

const TerminalEntity = require('../lib/entities/terminal_entity.js')
const assert = require('assert')
const co = require('co')

describe('terminal-entity', () => {
  before(() => co(function * () {

  }))

  after(() => co(function * () {

  }))

  it('Terminal entity', () => co(function * () {
    let entity = new TerminalEntity({ key: 'hoge' })
    entity.addSpot({ key: 's1' })
    entity.addSpot({ key: 's2' })
    entity.addSpot({ key: 's3' })
    entity.removeSpot({ key: 's2' })
    assert.deepEqual(entity.spots, [ 's1', 's3' ])
  }))
})

/* global describe, before, after, it */
