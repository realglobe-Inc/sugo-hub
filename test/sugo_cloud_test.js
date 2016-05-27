/**
 * Test case for sugoCloud.
 * Runs with mocha.
 */
'use strict'

const sugoCloud = require('../lib/sugo_cloud.js')
const sgSocketClient = require('sg-socket-client')
const assert = require('assert')
const co = require('co')
const { SpotEvents } = require('sg-socket-constants')

describe('sugo-cloud', function () {
  this.timeout(4000)
  before(() => co(function * () {

  }))

  after(() => co(function * () {

  }))

  it('Sugo cloud', () => co(function * () {
    let { HI, BYE, ABOUT } = SpotEvents
    let port = 9871
    let cloud = yield sugoCloud({
      port,
      storage: `${__dirname}/../tmp/testing-cloud-storage`,
    })
    let client01 = sgSocketClient(`http://localhost:${port}`)
    yield new Promise((resolve) => {
      client01.on(HI, () => resolve())
      client01.emit(HI, {
        key: 'hogehoge'
      })
    })
    client01.close()
    yield cloud.close()
  }))
})

/* global describe, before, after, it */
