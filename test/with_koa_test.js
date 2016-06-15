/**
 * Test case for withKoa.
 * Runs with mocha.
 */
'use strict'

const withKoa = require('../lib/with_koa.js')
const apemanrequest = require('apemanrequest')
const assert = require('assert')
const co = require('co')

const { Router } = withKoa

describe('with-koa', () => {
  let request = apemanrequest.create({})
  before(() => co(function * () {

  }))

  after(() => co(function * () {

  }))

  it('With koa', () => co(function * () {
    let port = 9881
    let cloud = yield withKoa({
      port,
      storage: `${__dirname}/../tmp/testing-cloud-koa`,
      middlewares: [
        new Router()
          .get('/foo/bar', (ctx) => {
            ctx.body = 'This is bar'
          }).routes()
      ]
    })
    let { statusCode, body } = yield request({
      method: 'GET',
      url: `http://localhost:${port}/foo/bar`
    })
    assert.equal(statusCode, 200)
    assert.equal(body, 'This is bar')
    yield cloud.close()
  }))
})

/* global describe, before, after, it */
