/**
 * Test case for service.
 * Runs with mocha.
 */
'use strict'

const Service = require('../lib/services/service.js')
const assert = require('assert')

const sgStorage = require('sg-storage')

describe('service', () => {
  let storage = sgStorage(`${__dirname}/../tmp/testing-service-storage`)
  before(async () => {
  })

  after(async () => {

  })

  it('Service', async () => {
    let service = new Service(storage, {
      indices: [ 'socketId' ]
    })
    assert.ok(service)
    await service.save({
      key: 'hoge',
      value: 'This is hoge',
      socketId: 0
    })
    await service.save({
      key: 'fuge',
      value: 'This is fuge',
      socketId: 1
    })
    let hoge = await service.find('hoge')
    assert.ok(hoge)
    assert.equal(hoge.value, 'This is hoge')
    let nullFound = await service.find(null)
    assert.equal(nullFound, null)
    let fuge = await service.find('fuge')
    assert.ok(fuge)
    assert.equal(fuge.value, 'This is fuge')
    let destroyed = await service.destroy('fuge')
    assert.equal(destroyed, 1)
    destroyed = await service.destroy('fuge')
    assert.equal(destroyed, 0)
    fuge = await service.find('fuge')
    assert.ok(!fuge)
    hoge = await service.findByIndex('socketId', 0)
    assert.ok(hoge)
    assert.equal(hoge.value, 'This is hoge')
  })
})

/* global describe, before, after, it */
