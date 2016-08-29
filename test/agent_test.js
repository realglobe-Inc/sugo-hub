/**
 * Test case for agent.
 * Runs with mocha.
 */
'use strict'

const agent = require('../lib/agent.js')
const SugoHub = require('../lib/sugo_hub')
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
    let hub = yield new SugoHub({
      storage: `${__dirname}/../tmp/testing-cloud-storage2`
    }).listen(port)

    let actors = yield agent(`http://localhost:${port}`).actors()
    assert.ok(actors)

    yield hub.close()
  }))
})

/* global describe, before, after, it */
