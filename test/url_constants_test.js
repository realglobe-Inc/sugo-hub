/**
 * Test case for urlConstants.
 * Runs with mocha.
 */
'use strict'

const UrlConstants = require('../lib/constatns/url_constants.js')
const assert = require('assert')
const co = require('co')

describe('url-constants', () => {
  before(() => co(function * () {

  }))

  after(() => co(function * () {

  }))

  it('Url constants', () => co(function * () {
    for (let name of Object.keys(UrlConstants)) {
      assert.ok(UrlConstants[ name ])
    }
  }))
})

/* global describe, before, after, it */
