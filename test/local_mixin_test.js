/**
 * Test case for localMixin.
 * Runs with mocha.
 */
'use strict'

const localMixin = require('../lib/mixins/local_mixin.js')
const assert = require('assert')

const SugoHub = require('../lib/sugo_hub')
const sugoActor = require('sugo-actor')
const sugoCaller = require('sugo-caller')
const sugoObserver = require('sugo-observer')
const arequest = require('arequest')
const aport = require('aport')

describe('local-mixin', function () {
  this.timeout(3000)
  before(async () => {

  })

  after(async () => {

  })

  it('Local mixin', async () => {
    const port = await aport()

    const caller01 = sugoCaller({
      port
    })

    const hub = await new SugoHub({
      storage: `${__dirname}/../tmp/testing-local-storage`,
      localActors: {
        'my-actor-01': sugoActor({
          modules: {
            say: {
              sayYes: () => 'Yes from actor01'
            }
          }
        })
      }
    }).listen(port)

    {
      const actor01 = await caller01.connect(hub.localActors['my-actor-01'].key)
      assert.ok(actor01)
      const say = actor01.get('say')
      const yes = await say.sayYes()
      assert.equal(yes, 'Yes from actor01')
      await actor01.disconnect()

      await caller01.disconnect()
    }

    await hub.close()
  })
})

/* global describe, before, after, it */
