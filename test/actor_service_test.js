/**
 * Test case for actorService.
 * Runs with mocha.
 */
'use strict'

const ActorService = require('../lib/services/actor_service.js')
const sgStorage = require('sg-storage')
const assert = require('assert')
const uuid = require('uuid')


describe('actor-service', () => {
  before(async () => {

  })

  after(async () => {

  })

  it('Actor service', async () => {
    let storage = sgStorage(`${__dirname}/../tmp/testing-actor-service`)
    let service = new ActorService(storage)
    assert.ok(service)
    let socketId = uuid.v4()
    let key = 'hoge'
    await service.setupActor(socketId, key)
    await service.updateSpec(socketId, 'yo', {
      name: 'Yo module',
      version: '1.0.0',
      methods: {}
    })
    {
      let { $specs } = await service.find(key)
      assert.ok($specs.yo)
    }
    await service.delSpec(socketId, 'yo')
    {
      let { $specs } = await service.find(key)
      assert.ok(!$specs.yo)
    }
    await service.teardownActor(socketId, key)
    await storage.end()
  })
})

/* global describe, before, after, it */
