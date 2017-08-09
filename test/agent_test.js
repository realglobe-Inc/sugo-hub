/**
 * Test case for agent.
 * Runs with mocha.
 */
'use strict'

const agent = require('../lib/agent.js')
const SugoHub = require('../lib/sugo_hub')
const assert = require('assert')
const aport = require('aport')


describe('agent', function () {
  this.timeout(3000)
  let port
  before(async () => {

  })

  after(async () => {

  })

  it('Agent', async () => {
    port = await aport()
    let hub = await new SugoHub({
      storage: `${__dirname}/../tmp/testing-cloud-storage2`
    }).listen(port)

    let actors = await agent(`http://localhost:${port}`).actors()
    assert.ok(actors)

    await hub.close()
  })
})

/* global describe, before, after, it */
