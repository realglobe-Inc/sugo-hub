/**
 * Test case for sugoHub.
 * Runs with mocha.
 */
'use strict'

const SugoHub = require('../lib/sugo_hub')
const sugoActor = require('sugo-actor')
const {Module} = sugoActor
const sugoCaller = require('sugo-caller')
const sugoObserver = require('sugo-observer')
const arequest = require('arequest')
const {fork} = require('child_process')
const aport = require('aport')
const asleep = require('asleep')
const {ok, equal, ifError} = require('assert')

const http = require('http')
const {modularize} = require('sugo-actor/module')
const {hasBin} = require('sg-check')
const {ACTOR_URL, CALLER_URL, OBSERVER_URL} = SugoHub
const {RemoteEvents} = require('sg-socket-constants')
const {JOIN, LEAVE, NOTICE} = RemoteEvents

describe('sugo-hub', function () {
  this.timeout(4800 * 1000)
  let request = arequest.create({jar: true})
  before(async () => {

  })

  after(async () => {

  })

  it('Sugo hub', async () => {
    let port = await aport()
    let observed = []

    let hub = await new SugoHub({
      storage: `${__dirname}/../tmp/testing-hub-storage`,
      interceptors: {
        [ACTOR_URL]: async (socket) => {
          equal(socket.nsp.name, '/actors')
          await asleep(10)
        }
      }
    }).listen(port)

    class YoPerson {
      sayYo () {
        return 'yo!'
      }
    }

    const YoPersonModule = modularize(YoPerson)

    const emitter = new Module({})

    const actor01 = sugoActor({
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

    let caller01 = sugoCaller({host: `localhost:${port}`})
    let caller02 = sugoCaller({host: `localhost:${port}`})
    let caller03 = sugoCaller({host: `localhost:${port}`})

    await actor01.connect()
    await asleep(10)
    await actor02.connect()
    await asleep(10)

    actor01.joinedCallers = {}
    actor01.socket.on(JOIN, ({caller, messages}) => {
      actor01.joinedCallers[caller.key] = caller
      ok(caller)
    })
    actor01.socket.on(LEAVE, ({caller, messages}) => {
      delete actor01.joinedCallers[caller.key]
      ok(caller)
    })

    let observer01 = sugoObserver((data) => {
      observed.push(data)
    }, {port})

    await observer01.start()

    // Perform an action
    {
      equal(Object.keys(actor01.joinedCallers).length, 0)
      let connection = await caller01.connect(actor01.key)
      equal(Object.keys(actor01.joinedCallers).length, 1)
      {
        if (await hasBin('ls')) {
          let bash = connection.get('bash')
          let payload = await bash.spawn('ls', ['-la'])
          equal(payload, 0, 'Exit with 0')
        }
      }
      {
        let yo = connection.get('yo')
        equal((await yo.sayYo()), 'yo!')
      }
      {
        let receiver = connection.get('emitter')
        let shouldNull = await new Promise((resolve, reject) => {
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
      await connection.disconnect()
      equal(Object.keys(actor01.joinedCallers).length, 0)
    }

    // Try to connect invalid actor
    {
      let connection, caught
      try {
        connection = await caller02.connect('___invalid_actor_key___')
        await connection.disconnect()
      } catch (err) {
        caught = err
      }
      ok(caught)
    }

    // Get actors info
    {
      let {body, statusCode} = await request(`http://localhost:${port}/actors`)
      equal(statusCode, 200)
      ok(body)
      let {meta, data, included} = body
      ok(meta)
      ok(data)
      ok(included)
      data.forEach((data) => equal(data.type, 'actors'))
    }

    // Get callers info
    {
      let {body, statusCode} = await request(`http://localhost:${port}/callers`)
      equal(statusCode, 200)
      ok(body)
      let {meta, data, included} = body
      ok(meta)
      ok(data)
      ok(included)
      data.forEach((data) => equal(data.type, 'callers'))
    }

    // When socket hang up
    {
      await caller03.connect(actor01.key)
      let {sockets} = caller03
      for (let name of Object.keys(sockets)) {
        let socket = sockets[name]
        socket.disconnect()
      }
    }

    await actor01.disconnect()
    await actor02.disconnect()

    await observer01.stop()

    await asleep(400)

    ok(observed.length > 0)

    await hub.close()
  })

  it('Create from custom http server.', async () => {
    let port = 9872
    let hub = await new SugoHub({
      server: http.createServer((req, res, next) => {
      })
    }).listen(port)
    equal(hub.port, port)
    await hub.close()
  })

  it('Transport built in types', async () => {
    let port = await aport()
    let hub = await new SugoHub({
      storage: `${__dirname}/../tmp/testing-hub-storage`
    }).listen(port)

    let actor01 = sugoActor({
      port,
      key: 'actor01',
      modules: {
        withType: new Module({
          receiveInstances (data) {
            let {date01} = data
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
    await actor01.connect()
    {
      let caller01 = sugoCaller({port})
      let actor01 = await caller01.connect('actor01')
      let withType = actor01.get('withType')
      await withType.receiveInstances({date01: new Date()})
      let {date02} = await withType.getInstances()
      ok(date02 instanceof Date)
      await actor01.disconnect()
    }
    await actor01.disconnect()
    await hub.close()
  })

  it('Use auth', async () => {
    let port = await aport()

    let hub = await new SugoHub({
      storage: `${__dirname}/../tmp/testing-auth-storage`,
      authenticate: async (socket, data) => {
        let {token} = data
        return token === 'hogehogehoge'
      }
    }).listen(port)

    {
      let actor01 = sugoActor({
        host: `localhost:${port}`,
        key: 'my-actor-01',
        force: true,
        auth: {
          token: 'hogehogehoge'
        },
        modules: {hoge: new Module(() => {})}
      })

      await actor01.connect()
      await actor01.disconnect()
    }

    {
      let actor02 = sugoActor({
        host: `localhost:${port}`,
        key: 'my-actor-01',
        force: true,
        auth: {
          token: '__invalid_token__'
        },
        modules: {fuge: new Module(() => {})}
      })
      let caught
      try {
        await actor02.connect()
      } catch (err) {
        caught = err
      }
      ok(!!caught)
    }

    equal(hub.port, port)
    await hub.close()
  })

  it('Using redis', async () => {
    try {
      let hub = new SugoHub({
        storage: {
          redis: {
            host: '127.0.0.1',
            port: '6379',
            db: 2
          }
        }
      })
      let port = await aport()
      await hub.listen(port)
      await asleep(100)

      const actor = sugoActor({
        key: 'actor-xxxx',
        protocol: 'http',
        host: `localhost:${port}`,
        modules: {
          pinger: new Module({
            ping () {
              return 'pong from actor'
            }
          })
        }
      })

      await actor.connect()

      await asleep(100)

      await actor.disconnect()
      await hub.close()
    } catch (e) {
      console.error(e)
    }
  })

  // https://github.com/realglobe-Inc/sugo-hub/issues/22
  it('issues/22', async () => {
    const hub1Port = await aport()
    const hub2Port = await aport()

    async function launchHub (port) {
      const hub = new SugoHub({
        storage: {
          redis: {
            host: '127.0.0.1',
            port: '6379',
            db: 2,
            requestsTimeout: 3000
          }
        }
      })
      await hub.listen(port)
      return hub
    }

    const hub1 = await launchHub(hub1Port)
    const hub2 = await launchHub(hub2Port)

    const actor = sugoActor({
      key: 'actor-01',
      host: `localhost:${hub1Port}`,
      modules: {
        pinger: new Module({
          ping () {
            return 'pong from actor'
          }
        })
      }
    })
    await actor.connect()

    {
      const caller = sugoCaller({
        protocol: 'http',
        host: `localhost:${hub2Port}`
      })
      const actor = await caller.connect('actor-01')
      const pinger = actor.get('pinger')
      const pong = await pinger.ping()
      equal(pong, 'pong from actor')

      await caller.disconnect()
    }

    await actor.disconnect()

    await asleep(100)

    await hub1.close()
    await hub2.close()
  })

  it('A lot of performs', async () => {
    let port = await aport()
    let hub = new SugoHub({
      storage: `${__dirname}/../var/testing-a-lot-of-performs`
    })
    await hub.listen(port)

    const actor = sugoActor({
      key: 'actor-hoge',
      host: `localhost:${port}`,
      modules: {
        pinger: new Module({
          async ping () {
            await asleep(100)
            return 'pong from actor'
          }
        })
      }
    })

    await actor.connect()

    {
      let caller = sugoCaller({
        protocol: 'http',
        host: `localhost:${port}`
      })
      let actor = await caller.connect('actor-hoge')
      let pinger = actor.get('pinger')
      let promises = []

      for (let i = 0; i < 100; i++) {
        promises.push(
          pinger.ping()
        )
      }
      await Promise.all(promises)

      await caller.disconnect()
    }

    await actor.disconnect()

    await hub.close()
  })

  it('Detect caller gone', async () => {
    let port = await aport()
    let hub = new SugoHub({
      storage: `${__dirname}/../var/detect-caller-gone`
    })
    await hub.listen(port)

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

    await actor.connect()

    let notices = {}
    actor.socket.on(NOTICE, ({name, data}) => {
      notices[name] = data
    })

    {
      let caller = sugoCaller({port})
      let actor = await caller.connect('actor-foo')

      let say = actor.get('say')

      say.hiWithDelay()

      await asleep(10)

      // Force disconnect
      caller.sockets['actor-foo'].disconnect()

      await asleep(30)
    }

    await actor.disconnect()

    await hub.close()

    ok(notices['CallerGone'])
  })

  it('Detect actor gone', async () => {
    let port = await aport()
    let hub = new SugoHub({
      storage: `${__dirname}/../var/detect-actor-gone`
    })
    await hub.listen(port)

    let actor = sugoActor({
      key: 'actor-foo',
      port,
      modules: {
        say: new Module({
          hiWithDelay () {
            return new Promise((resolve, reject) => {
              setTimeout(() => resolve('hi!'), 500)
            })
          }
        })
      }
    })

    await actor.connect()
    let notices = {}
    let caught
    let caller = sugoCaller({port})
    {
      let actor = await caller.connect('actor-foo')
      let say = actor.get('say')
      void say.hiWithDelay().catch((thrown) => {
        caught = thrown
      })

      caller.sockets['actor-foo'].on(NOTICE, ({name, data}) => {
        notices[name] = data
      })
    }
    await actor.disconnect()

    await asleep(180)
    await caller.disconnect()

    await hub.close()
    await asleep(180)
    ok(caught)
    equal(caught.name, 'ActorGone')
    ok(notices['ActorGone'])

    await asleep(80)
  })

  it('Using cluster', async () => {
    const port = await aport()

    const server = fork(
      require.resolve('../misc/mocks/mock-server.js'),
      [],
      {
        env: Object.assign({}, process.env, {port}),
        stdio: 'inherit'
      }
    )

    await asleep(2200)

    const caller01 = sugoCaller({
      port
    })

    {
      const actor01 = await caller01.connect('my-actor-01')
      ok(actor01)
      const say = actor01.get('say')
      const yes = await say.sayYes()
      equal(yes, 'Yes from actor01')
      await actor01.disconnect()
    }

    await asleep(100)
    await caller01.disconnect()

    await server.kill()
  })
})

/* global describe, before, after, it */
