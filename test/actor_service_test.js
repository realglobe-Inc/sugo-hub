/**
 * Test case for actorService.
 * Runs with mocha.
 */
'use strict'

const ActorService = require('../lib/services/actor_service.js')
const sgStorage = require('sg-storage')
const assert = require('assert')
const uuid = require('uuid')
const co = require('co')

describe('actor-service', () => {
  before(() => co(function * () {

  }))

  after(() => co(function * () {

  }))

  it('Actor service', () => co(function * () {
    let storage = sgStorage(`${__dirname}/../tmp/testing-actor-service`)
    let service = new ActorService(storage)
    assert.ok(service)
    let socketId = uuid.v4()
    let key = 'hoge'
    yield service.setupActor(socketId, key)
    yield service.updateSpec(socketId, 'yo', {
      name: 'Yo module',
      version: '1.0.0',
      methods: {}
    })
    yield service.delSpec(socketId, 'yo')
    yield service.teardownActor(socketId, key)
    yield storage.end()
  }))
})

/* global describe, before, after, it */
