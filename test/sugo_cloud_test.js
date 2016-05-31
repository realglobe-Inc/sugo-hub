/**
 * Test case for sugoCloud.
 * Runs with mocha.
 */
'use strict'

const sugoCloud = require('../lib/sugo_cloud.js')
const sgSocketClient = require('sg-socket-client')
const assert = require('assert')
const co = require('co')
const { GreetingEvents, RemoteEvents } = require('sg-socket-constants')
let { HI, BYE } = GreetingEvents

describe('sugo-cloud', function () {
  this.timeout(4000)
  before(() => co(function * () {

  }))

  after(() => co(function * () {

  }))

  it('Sugo cloud', () => co(function * () {
    let port = 9871

    let cloud = yield sugoCloud({
      port,
      storage: `${__dirname}/../tmp/testing-cloud-storage`
    })

    let spot01 = sgSocketClient(`http://localhost:${port}/spots`)
    yield spot01.call(HI, { key: 'my-spot-01' })

    let spot02 = sgSocketClient(`http://localhost:${port}/spots`)
    let hi02 = yield spot02.call(HI, { key: 'my-spot-02' })

    try {
      yield spot02.call(BYE, {
        key: 'my-spot-02',
        token: 'invalid_token'
      })
    } catch (err) {
      assert.ok(err)
    }

    yield spot02.call(BYE, {
      key: 'my-spot-02',
      token: hi02.payload.token
    })

    spot01.close()
    spot02.close()

    yield cloud.close()
  }))
})

/* global describe, before, after, it */
