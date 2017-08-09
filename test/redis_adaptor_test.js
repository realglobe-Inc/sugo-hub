/**
 * Test case for redisAdaptor.
 * Runs with mocha.
 */
'use strict'

const redisAdaptor = require('../lib/adaptors/redis_adaptor.js')
const sgServer = require('sg-server')
const sgSocket = require('sg-socket')
const assert = require('assert')


describe('redis-adaptor', function () {
  this.timeout(3000)

  before(async () => {

  })

  after(async () => {

  })

  it('Redis adaptor', async () => {
    let server = sgServer()
    let io = sgSocket(server, {})
    redisAdaptor(io, {})
  })
})

/* global describe, before, after, it */
