/**
 * Test case for service.
 * Runs with mocha.
 */
'use strict'

const Service = require('../lib/services/service.js')
const assert = require('assert')
const co = require('co')
const sgStorage = require('sg-storage')

describe('service', () => {
  let storage = sgStorage(`${__dirname}/../tmp/testing-service-storage`)
  before(() => co(function * () {
  }))

  after(() => co(function * () {

  }))

  it('Service', () => co(function * () {
    let service = new Service(storage, {
      indices: [ 'socketId' ]
    })
    assert.ok(service)
    yield service.save({
      key: 'hoge',
      value: 'This is hoge',
      socketId: 0
    })
    yield service.save({
      key: 'fuge',
      value: 'This is fuge',
      socketId: 1
    })
    let hoge = yield service.find('hoge')
    assert.ok(hoge)
    assert.equal(hoge.value, 'This is hoge')
    let nullFound = yield service.find(null)
    assert.equal(nullFound, null)
    let fuge = yield service.find('fuge')
    assert.ok(fuge)
    assert.equal(fuge.value, 'This is fuge')
    let destroyed = yield service.destroy('fuge')
    assert.equal(destroyed, 1)
    destroyed = yield service.destroy('fuge')
    assert.equal(destroyed, 0)
    fuge = yield service.find('fuge')
    assert.ok(!fuge)
    hoge = yield service.findByIndex('socketId', 0)
    assert.ok(hoge)
    assert.equal(hoge.value, 'This is hoge')
  }))
})

/* global describe, before, after, it */
