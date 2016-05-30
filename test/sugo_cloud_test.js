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

    let client01 = sgSocketClient(`http://localhost:${port}`)
    yield client01.call(HI, {})

    let client02 = sgSocketClient(`http://localhost:${port}`)
    yield client02.call(HI, {})

    yield client02.call(BYE, {})
    client01.close()
    client02.close()

    yield cloud.close()
  }))
})

/* global describe, before, after, it */
