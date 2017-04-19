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
const { ok, equal, ifError } = require('assert')
const co = require('co')
const http = require('http')
const { modularize } = require('sugo-actor/module')
const { hasBin } = require('sg-check')
const { ACTOR_URL, CALLER_URL, OBSERVER_URL } = SugoHub
const { RemoteEvents } = require('sg-socket-constants')
const { JOIN, LEAVE, NOTICE } = RemoteEvents

describe('sugo-hub', function () {
  this.timeout(21000)
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
          equal(socket.nsp.name, '/actors')
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

    actor01.joinedCallers = {}
    actor01.socket.on(JOIN, ({ caller, messages }) => {
      actor01.joinedCallers[ caller.key ] = caller
      ok(caller)
    })
    actor01.socket.on(LEAVE, ({ caller, messages }) => {
      delete actor01.joinedCallers[ caller.key ]
      ok(caller)
    })

    let observer01 = sugoObserver((data) => {
      observed.push(data)
    }, { port })

    yield observer01.start()

    // Perform an action
    {
      equal(Object.keys(actor01.joinedCallers).length, 0)
      let connection = yield caller01.connect(actor01.key)
      equal(Object.keys(actor01.joinedCallers).length, 1)
      {
        if (yield hasBin('ls')) {
          let bash = connection.get('bash')
          let payload = yield bash.spawn('ls', [ '-la' ])
          equal(payload, 0, 'Exit with 0')
        }
      }
      {
        let yo = connection.get('yo')
        equal((yield yo.sayYo()), 'yo!')
      }
      {
        let receiver = connection.get('emitter')
        let shouldNull = yield new Promise((resolve, reject) => {
          let timer = setInterval(() => {
            resolve(new Error('Caller didn\'t receive event from actor.'))
          }, 2000)
          receiver.on('some event', (data) => {
            equal(data, 'some message')
            clearTimeout(timer)
            resolve()
          })
          emitter.emit('some event', 'some message')
        })
        ifError(shouldNull)
      }

      equal(Object.keys(actor01.joinedCallers).length, 1)
      yield connection.disconnect()
      equal(Object.keys(actor01.joinedCallers).length, 0)
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
      ok(caught)
    }

    // Get actors info
    {
      let { body, statusCode } = yield request(`http://localhost:${port}/actors`)
      equal(statusCode, 200)
      ok(body)
      let { meta, data, included } = body
      ok(meta)
      ok(data)
      ok(included)
      data.forEach((data) => equal(data.type, 'actors'))
    }

    // Get callers info
    {
      let { body, statusCode } = yield request(`http://localhost:${port}/callers`)
      equal(statusCode, 200)
      ok(body)
      let { meta, data, included } = body
      ok(meta)
      ok(data)
      ok(included)
      data.forEach((data) => equal(data.type, 'callers'))
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

    ok(observed.length > 0)

    yield hub.close()
  }))

  it('Create from custom http server.', () => co(function * () {
    let port = 9872
    let hub = yield new SugoHub({
      server: http.createServer((req, res, next) => {
      })
    }).listen(port)
    equal(hub.port, port)
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
            ok(date01 instanceof Date)
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
      ok(date02 instanceof Date)
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
      ok(!!caught)
    }

    equal(hub.port, port)
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

  // https://github.com/realglobe-Inc/sugo-hub/issues/22
  it('issues/22', () => co(function * () {
    let hub1Port = yield aport()
    let hub2Port = yield aport()

    function launchHub (port) {
      return co(function * () {
        let hub = new SugoHub({
          storage: {
            redis: {
              host: '127.0.0.1',
              port: '6379',
              db: 2,
              requestsTimeout: 3000
            }
          }
        })
        yield hub.listen(port)
        return hub
      })
    }

    let hub1 = yield launchHub(hub1Port)
    let hub2 = yield launchHub(hub2Port)

    let actor = sugoActor({
      key: 'actor-01',
      protocol: 'http',
      host: `localhost:${hub1Port}`,
      modules: {
        pinger: new Module({
          ping () {
            return 'pong from actor'
          }
        })
      }
    })
    yield actor.connect()

    {
      let caller = sugoCaller({
        protocol: 'http',
        host: `localhost:${hub2Port}`
      })
      let actor = yield caller.connect('actor-01')
      let pinger = actor.get('pinger')
      let pong = yield pinger.ping()
      equal(pong, 'pong from actor')

      yield caller.disconnect()
    }

    yield actor.disconnect()

    yield asleep(100)

    yield hub1.close()
    yield hub2.close()
  }))

  it('A lot of performs', () => co(function * () {
    let port = yield aport()
    let hub = new SugoHub({
      storage: `${__dirname}/../var/testing-a-lot-of-performs`
    })
    yield hub.listen(port)

    let actor = sugoActor({
      key: 'actor-hoge',
      protocol: 'http',
      host: `localhost:${port}`,
      modules: {
        pinger: new Module({
          ping () {
            return co(function * () {
              yield asleep(100)
              return 'pong from actor'
            })
          }
        })
      }
    })

    yield actor.connect()

    {
      let caller = sugoCaller({
        protocol: 'http',
        host: `localhost:${port}`
      })
      let actor = yield caller.connect('actor-hoge')
      let pinger = actor.get('pinger')
      let promises = []

      for (let i = 0; i < 100; i++) {
        promises.push(
          pinger.ping()
        )
      }
      yield Promise.all(promises)

      yield caller.disconnect()
    }

    yield actor.disconnect()

    yield hub.close()
  }))

  it('Detect caller gone', () => co(function * () {
    let port = yield aport()
    let hub = new SugoHub({
      storage: `${__dirname}/../var/detect-caller-gone`
    })
    yield hub.listen(port)

    let actor = sugoActor({
      key: 'actor-foo',
      port,
      modules: {
        say: new Module({
          hiWithDelay () {
            return new Promise((resolve, reject) => {
              setTimeout(() => resolve('hi!'), 50)
            })
          }
        })
      }
    })

    yield actor.connect()

    let notices = {}
    actor.socket.on(NOTICE, ({ name, data }) => {
      notices[ name ] = data
    })

    {
      let caller = sugoCaller({ port })
      let actor = yield caller.connect('actor-foo')

      let say = actor.get('say')

      say.hiWithDelay()

      yield asleep(10)

      // Force disconnect
      caller.sockets[ 'actor-foo' ].disconnect()

      yield asleep(30)
    }

    yield actor.disconnect()

    yield hub.close()

    ok(notices[ 'CallerGone' ])
  }))

  it('Detect actor gone', () => co(function * () {
    let port = yield aport()
    let hub = new SugoHub({
      storage: `${__dirname}/../var/detect-actor-gone`
    })
    yield hub.listen(port)

    let actor = sugoActor({
      key: 'actor-foo',
      port,
      modules: {
        say: new Module({
          hiWithDelay () {
            return new Promise((resolve, reject) => {
              setTimeout(() => resolve('hi!'), 50)
            })
          }
        })
      }
    })

    yield actor.connect()

    let caught
    let caller = sugoCaller({ port })
    {
      let actor = yield caller.connect('actor-foo')
      let say = actor.get('say')
      say.hiWithDelay().catch((thrown) => {
        caught = thrown
      })
      yield asleep(10)
    }

    yield actor.disconnect()

    yield asleep(80)
    yield caller.disconnect()

    yield hub.close()

    ok(caught)
    equal(caught.name, 'ActorGone')
  }))
})

/* global describe, before, after, it */
