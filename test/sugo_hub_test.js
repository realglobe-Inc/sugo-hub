/**
 * Test case for sugoHub.
 * Runs with mocha.
 */
'use strict'

const sugoHub = require('../lib/sugo_hub')
const sugoActor = require('sugo-actor')
const { Module } = sugoActor
const sugoCaller = require('sugo-caller')
const sugoObserver = require('sugo-observer')
const arequest = require('arequest')
const aport = require('aport')
const asleep = require('asleep')
const assert = require('assert')
const co = require('co')
const http = require('http')
const { modularize } = require('sugo-actor/module')
const { ACTOR_URL, CALLER_URL, OBSERVER_URL } = sugoHub

describe('sugo-hub', function () {
  this.timeout(12000)
  let request = arequest.create({ jar: true })
  before(() => co(function * () {

  }))

  after(() => co(function * () {

  }))

  it('Sugo hub', () => co(function * () {
    let port = yield aport()
    let observed = []

    let hub = yield sugoHub({
      port,
      storage: `${__dirname}/../tmp/testing-hub-storage`,
      interceptors: {
        [ACTOR_URL]: (socket) => co(function * () {
          assert.equal(socket.nsp.name, '/actors')
          yield asleep(10)
        })
      }
    })

    class YoPerson {
      sayYo () {
        return 'yo!'
      }
    }
    const YoPersonModule = modularize(YoPerson)

    let actor01 = sugoActor({
      host: `localhost:${port}`,
      key: 'my-actor-01',
      force: true,
      modules: {
        bash: new (require('sugo-actor/misc/mocks/mock-module-bash.js'))(),
        yo: new YoPersonModule()
      }
    })

    let actor02 = sugoActor({
      port,
      key: 'my-actor-02-' + new Date().getTime(),
      force: true,
      modules: {
        bash: new (require('sugo-actor/misc/mocks/mock-module-bash.js'))()
      }
    })

    let caller01 = sugoCaller({ host: `localhost:${port}` })
    let caller02 = sugoCaller({ host: `localhost:${port}` })

    yield actor01.connect()
    yield actor02.connect()

    let observer01 = sugoObserver((data) => {
      observed.push(data)
    }, { port })

    yield observer01.start()

    // Perform an action
    {
      let connection = yield caller01.connect(actor01.key)
      {
        let bash = connection.get('bash')
        let payload = yield bash.spawn('ls', [ '-la' ])
        assert.equal(payload, 0, 'Exit with 0')
      }
      {
        let yo = connection.get('yo')
        assert.equal((yield yo.sayYo()), 'yo!')
      }

      yield hub.invalidateCallers()
      yield connection.disconnect()
    }

    yield hub.invalidateActors()

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
      let { body, statusCode } = yield request(`http://localhost:${port}/actors`)
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
      let { body, statusCode } = yield request(`http://localhost:${port}/callers`)
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

    yield asleep(400)

    assert.ok(observed.length > 0)

    yield hub.close()
  }))

  it('Create from custom http server.', () => co(function * () {
    let port = 9872
    let hub = yield sugoHub({
      port,
      server: http.createServer((req, res, next) => {
      })
    })
    assert.equal(hub.port, port)
    yield hub.close()
  }))

  it('Use auth', () => co(function * () {
    let port = yield aport()

    let hub = yield sugoHub({
      port,
      storage: `${__dirname}/../tmp/testing-auth-storage`,
      authenticate: (socket, data) => co(function * () {
        let { token } = data
        return token === 'hogehogehoge'
      })
    })

    {
      let actor01 = sugoActor({
        host: `localhost:${port}`,
        key: 'my-actor-01',
        force: true,
        auth: {
          token: 'hogehogehoge'
        },
        modules: { hoge: new Module(() => {}) }
      })

      yield actor01.connect()
      yield actor01.disconnect()
    }

    {
      let actor02 = sugoActor({
        host: `localhost:${port}`,
        key: 'my-actor-01',
        force: true,
        auth: {
          token: '__invalid_token__'
        },
        modules: { fuge: new Module(() => {}) }
      })
      let caught
      try {
        yield actor02.connect()
      } catch (err) {
        caught = err
      }
      assert.ok(!!caught)
    }

    assert.equal(hub.port, port)
    yield hub.close()
  }))
})

/* global describe, before, after, it */
