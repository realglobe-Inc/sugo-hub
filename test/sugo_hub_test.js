/**
 * Test case for sugoHub.
 * Runs with mocha.
 */
'use strict'

const sugoHub = require('../lib/sugo_hub')
const sugoActor = require('sugo-actor')
const sugoCaller = require('sugo-caller')
const sugoObserver = require('sugo-observer')
const arequest = require('arequest')
const aport = require('aport')
const assert = require('assert')
const co = require('co')
const http = require('http')

describe('sugo-hub', function () {
  this.timeout(4000)
  let request = arequest.create({ jar: true })
  before(() => co(function * () {

  }))

  after(() => co(function * () {

  }))

  it('Sugo cloud', () => co(function * () {
    let port = yield aport()
    let observed = []

    let cloud = yield sugoHub({
      port,
      storage: `${__dirname}/../tmp/testing-cloud-storage`
    })

    let ACTOR_URL = `http://localhost:${port}/actors`
    let CALLER_URL = `http://localhost:${port}/callers`
    let OBSERVER_URL = `http://localhost:${port}/observers`

    let actor01 = sugoActor(ACTOR_URL, {
      key: 'my-actor-01',
      force: true,
      modules: {
        bash: new (require('sugo-actor/misc/mocks/mock-module-bash.js'))()
      }
    })

    let actor02 = sugoActor(ACTOR_URL, {
      key: 'my-actor-02-' + new Date().getTime(),
      force: true,
      modules: {
        bash: new (require('sugo-actor/misc/mocks/mock-module-bash.js'))()
      }
    })

    let caller01 = sugoCaller(CALLER_URL, {})
    let caller02 = sugoCaller(CALLER_URL, {})

    yield actor01.connect()
    yield actor02.connect()

    let observer01 = sugoObserver(OBSERVER_URL, (data) => {
      observed.push(data)
    })

    yield observer01.start()

    // Perform an action
    {
      let connection = yield caller01.connect(actor01.key)
      let bash = connection.get('bash')
      let payload = yield bash.spawn('ls', [ '-la' ])
      assert.equal(payload, 0, 'Exit with 0')
      yield cloud.invalidateCallers()
      yield connection.disconnect()
    }

    yield cloud.invalidateActors()

    // Try to connect invalid actor
    {
      let connection, caught
      try {
        connection = yield caller02.connect('___invalid_actor_key___')
        yield connection.disconnect()
      } catch (err) {
        caught = err
      }
      assert.ok(caught)
    }

    // Get actors info
    {
      let { body, statusCode } = yield request(ACTOR_URL)
      assert.equal(statusCode, 200)
      assert.ok(body)
      let { meta, data, included } = body
      assert.ok(meta)
      assert.ok(data)
      assert.ok(included)
      data.forEach((data) => assert.equal(data.type, 'actors'))
    }

    // Get callers info
    {
      let { body, statusCode } = yield request(CALLER_URL)
      assert.equal(statusCode, 200)
      assert.ok(body)
      let { meta, data, included } = body
      assert.ok(meta)
      assert.ok(data)
      assert.ok(included)
      data.forEach((data) => assert.equal(data.type, 'callers'))
    }

    yield actor01.disconnect()
    yield actor02.disconnect()

    yield observer01.stop()

    yield new Promise((resolve) => setTimeout(resolve, 400))

    assert.ok(observed.length > 0)

    yield cloud.close()
  }))

  it('Create from custom http server.', () => co(function * () {
    let port = 9872
    let cloud = yield sugoHub({
      port,
      server: http.createServer((req, res, next) => {
      })
    })
    assert.equal(cloud.port, port)
    yield cloud.close()
  }))
})

/* global describe, before, after, it */
