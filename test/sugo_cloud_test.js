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
    yield spot01.call(HI, { })

    let spot02 = sgSocketClient(`http://localhost:${port}/spots`)
    yield spot02.call(HI, { })

    yield spot02.call(BYE, {})
    spot01.close()
    spot02.close()

    yield cloud.close()
  }))
})

/* global describe, before, after, it */
