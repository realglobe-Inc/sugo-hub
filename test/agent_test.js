/**
 * Test case for agent.
 * Runs with mocha.
 */
'use strict'

const agent = require('../lib/agent.js')
const sugoCloud = require('../lib/sugo_cloud.js')
const assert = require('assert')
const aport = require('aport')
const co = require('co')

describe('agent', function () {
  this.timeout(3000)
  let port
  before(() => co(function * () {

  }))

  after(() => co(function * () {

  }))

  it('Agent', () => co(function * () {
    port = yield aport()
    let cloud = yield sugoCloud({
      port,
      storage: `${__dirname}/../tmp/testing-cloud-storage2`
    })

    let actors = yield agent(`http://localhost:${port}`).actors()
    assert.ok(actors)
  }))
})

/* global describe, before, after, it */
