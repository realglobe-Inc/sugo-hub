/**
 * Test case for localMixin.
 * Runs with mocha.
 */
'use strict'

const localMixin = require('../lib/mixins/local_mixin.js')
const assert = require('assert')
const co = require('co')
const SugoHub = require('../lib/sugo_hub')
const sugoActor = require('sugo-actor')
const sugoCaller = require('sugo-caller')
const sugoObserver = require('sugo-observer')
const arequest = require('arequest')
const aport = require('aport')

describe('local-mixin', function () {
  this.timeout(3000)
  before(() => co(function * () {

  }))

  after(() => co(function * () {

  }))

  it('Local mixin', () => co(function * () {
    let port = yield aport()

    let caller01 = sugoCaller({
      port
    })

    let hub = yield new SugoHub({
      storage: `${__dirname}/../tmp/testing-local-storage`,
      localActors: {
        actor01: sugoActor({
          key: 'my-actor-01',
          modules: {
            say: {
              sayYes: () => 'Yes from actor01'
            }
          }
        })
      }
    }).listen(port)

    {
      let actor01 = yield caller01.connect(hub.localActors.actor01.key)
      assert.ok(actor01)
      let say = actor01.get('say')
      let yes = yield say.sayYes()
      assert.equal(yes, 'Yes from actor01')
      yield actor01.disconnect()

      yield caller01.disconnect()
    }

    yield hub.close()
  }))
})

/* global describe, before, after, it */
