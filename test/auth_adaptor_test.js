/**
 * Test case for authAdaptor.
 * Runs with mocha.
 */
'use strict'

const authAdaptor = require('../lib/adaptors/auth_adaptor.js')
const sgServer = require('sg-server')
const sgSocket = require('sg-socket')
const assert = require('assert')


describe('auth-adaptor', function () {
  this.timeout(3000)

  before(async () => {

  })

  after(async () => {

  })

  it('Auth adaptor', async () => {
    let server = sgServer()
    let io = sgSocket(server, {})
    authAdaptor(io, {
      authenticate () {
        return true
      }
    })
  })
})

/* global describe, before, after, it */
