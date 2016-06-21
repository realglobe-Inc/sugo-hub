/**
 * Test case for socketPool.
 * Runs with mocha.
 */
'use strict'

const SocketPool = require('../lib/pools/socket_pool.js')
const assert = require('assert')
const co = require('co')

describe('socket-pool', () => {
  before(() => co(function * () {

  }))

  after(() => co(function * () {

  }))

  it('Socket pool', () => co(function * () {
    let pool = new SocketPool({})
    assert.ok(pool)
  }))
})

/* global describe, before, after, it */
