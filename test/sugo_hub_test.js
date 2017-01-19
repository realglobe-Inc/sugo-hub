/**
 * Test case for sugoHub.
 * Runs with mocha.
 */
'use strict'

const SugoHub = require('../lib/sugo_hub')
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
const { hasBin } = require('sg-check')
const { ACTOR_URL, CALLER_URL, OBSERVER_URL } = SugoHub

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

    let hub = yield new SugoHub({
      storage: `${__dirname}/../tmp/testing-hub-storage`,
      interceptors: {
        [ACTOR_URL]: (socket) => co(function * () {
          assert.equal(socket.nsp.name, '/actors')
          yield asleep(10)
        })
      }
    }).listen(port)

    class YoPerson {
      sayYo () {
        return 'yo!'
      }
    }
    const YoPersonModule = modularize(YoPerson)

    let emitter = new Module({})

    let actor01 = sugoActor({
      host: `localhost:${port}`,
      key: 'my-actor-01',
      force: true,
      modules: {
        bash: new (require('sugo-actor/misc/mocks/mock-module-bash.js'))(),
        yo: new YoPersonModule(),
        emitter
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
    let caller03 = sugoCaller({ host: `localhost:${port}` })

    yield actor01.connect()
    yield asleep(10)
    yield actor02.connect()
    yield asleep(10)

    let observer01 = sugoObserver((data) => {
      observed.push(data)
    }, { port })

    yield observer01.start()

    // Perform an action
    {
      let connection = yield caller01.connect(actor01.key)
      {
        if (yield hasBin('ls')) {
          let bash = connection.get('bash')
          let payload = yield bash.spawn('ls', [ '-la' ])
          assert.equal(payload, 0, 'Exit with 0')
        }
      }
      {
        let yo = connection.get('yo')
        assert.equal((yield yo.sayYo()), 'yo!')
      }
      {
        let receiver = connection.get('emitter')
        let shouldNull = yield new Promise((resolve, reject) => {
          let timer = setInterval(() => {
            resolve(new Error('Caller didn\'t receive event from actor.'))
          }, 2000)
          receiver.on('some event', (data) => {
            assert.equal(data, 'some message')
            clearTimeout(timer)
            resolve()
          })
          emitter.emit('some event', 'some message')
        })
        assert.ifError(shouldNull)
      }

      yield connection.disconnect()
    }

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

    // When socket hang up
    {
      yield caller03.connect(actor01.key)
      let { sockets } = caller03
      for (let name of Object.keys(sockets)) {
        let socket = sockets[ name ]
        socket.disconnect()
      }
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
    let hub = yield new SugoHub({
      server: http.createServer((req, res, next) => {
      })
    }).listen(port)
    assert.equal(hub.port, port)
    yield hub.close()
  }))

  it('Transport built in types', () => co(function * () {
    let port = yield aport()
    let hub = yield new SugoHub({
      storage: `${__dirname}/../tmp/testing-hub-storage`
    }).listen(port)

    let actor01 = sugoActor({
      port,
      key: 'actor01',
      modules: {
        withType: new Module({
          receiveInstances (data) {
            let { date01 } = data
            assert.ok(date01 instanceof Date)
          },
          getInstances () {
            return {
              date02: new Date()
            }
          }
        })
      }
    })
    yield actor01.connect()
    {
      let caller01 = sugoCaller({ port })
      let actor01 = yield caller01.connect('actor01')
      let withType = actor01.get('withType')
      yield withType.receiveInstances({ date01: new Date() })
      let { date02 } = yield withType.getInstances()
      assert.ok(date02 instanceof Date)
      yield actor01.disconnect()
    }
    yield actor01.disconnect()
    yield hub.close()
  }))

  it('Use auth', () => co(function * () {
    let port = yield aport()

    let hub = yield new SugoHub({
      storage: `${__dirname}/../tmp/testing-auth-storage`,
      authenticate: (socket, data) => co(function * () {
        let { token } = data
        return token === 'hogehogehoge'
      })
    }).listen(port)

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

  it('Using redis', () => co(function * () {
    try {
      let hub = new SugoHub({
        storage: {
          redis: {
            host: '127.0.0.1',
            port: '6379',
            db: 1
          }
        }
      })
      let port = yield aport()
      yield hub.listen(port)
      yield asleep(200)
      yield hub.close()
    } catch (e) {
      console.error(e)
    }
  }))
})

/* global describe, before, after, it */
