#!/usr/bin/env node

/**
 * n 個の actor と n 個の caller が接続されている状態で、
 * 一斉に ping を送って pong が返ってくるまでの時間を計測する。
 */
'use strict'

process.env.DEBUG = process.env.DEBUG || 'sg:hub:benchmark,sg:hub'

const sugoHub = require('../lib')
const sugoActor = require('sugo-actor')
const sugoCaller = require('sugo-caller')
const { execSync } = require('child_process')
const { Module } = sugoActor
const co = require('co')
const aport = require('aport')
const Table = require('cli-table')
const asleep = require('asleep')
const debug = require('debug')('sg:hub:benchmark')
const logger = require('aslogger')()

// だいたい 300 以上で落ちる
const CONNECTION_NUMBERS = [
  10,
  50,
  100,
  300,
  500,
  1000
]

co(function * () {
  let startAt = new Date()
  logger.info('Connect benchmarks...')
  const port = yield aport()
  const hubUrl = `http://localhost:${port}`
  const actorUrl = `${hubUrl}/actors`
  const callerURL = `${hubUrl}/callers`

  checkRedis()
  let table = new Table({
    head: [ 'Connections', 'Pong time(ms)' ],
    colWidths: [ 20, 20 ]
  })
  yield startHub(port)
  for (let number of CONNECTION_NUMBERS) {
    logger.info(`Try connections with count: ${number}`)
    let actors = createActors(actorUrl, number)
    yield asleep(300)
    yield connectActors(actors)
    yield asleep(500)
    let callers = createCallers(callerURL, number)
    yield asleep(300)
    let connections = yield connectCallers(callers)
    yield asleep(300)
    let time = yield measurePingPong(connections)
    record(table, number, time)
    yield disconnectActors(actors)
    yield disconnectCallers(callers)
    yield asleep(300)
  }
  report(table)
  process.exit(0)
  logger.info(`...done! ( ${new Date() - startAt}ms )`)
}).catch((err) => {
  console.error(err)
  process.exit(1)
})

function checkRedis () {
  try {
    execSync('redis-cli ping')
  } catch (e) {
    console.error('At first, Redis server should be started. Try command "redis-server".')
    process.exit(1)
  }
}

function startHub (port) {
  return co(function * () {
    debug('Starts SUGO Hub')
    yield sugoHub({
      port,
      storage: {
        redis: {
          url: 'redis://127.0.0.1:6379',
          db: 1
        }
      }
    })
  })
}

function createActors (url, number) {
  let actors = numArray(number).map((number) =>
    sugoActor(url, {
      key: actorKey(number),
      modules: {
        tableTennis: new Module({
          ping () {
            return co(function * () {
              return 'pong'
            })
          }
        })
      }
    })
  )
  return actors
}

function connectActors (actors) {
  return co(function * () {
    debug('Connect actors.')
    let promises = actors.map((actor) => co(function * () {
      let connected = yield actor.connect()
      debug(`Actor connected: ${JSON.stringify(actor.key)}`)
      return connected
    }))
    yield Promise.all(promises)
  })
}

function disconnectActors (actors) {
  return co(function * () {
    debug('Disconnect actors.')
    let promises = actors.map((actor) => co(function * () {
      let disconnected = yield actor.disconnect()
      debug(`Actor disconnected: ${JSON.stringify(actor.key)}`)
      return disconnected
    }))
    yield Promise.all(promises)
  })
}

function createCallers (callerUrl, number) {
  let callers = numArray(number).map(() => sugoCaller(callerUrl))
  return callers
}

function connectCallers (callers) {
  return co(function * () {
    debug('Connect callers')
    let promises = callers.map((caller, i) => co(function * () {
      let key = actorKey(i)
      let connected = yield caller.connect(key)
      debug(`Caller connected to: ${JSON.stringify(key)}`)
      return connected
    }))
    return Promise.all(promises)
  })
}

function disconnectCallers (callers) {
  debug('Disconnect callers.')
  let promises = callers.map((caller, i) => co(function * () {
    let key = actorKey(i)
    let disconnected = yield caller.disconnect(key)
    debug(`Caller disconnect from: ${JSON.stringify(key)}`)
    return disconnected
  }))
  return Promise.all(promises)
}

function actorKey (number) {
  return `benchmark-actor-${number}`
}

function numArray (number) {
  return (new Array(number)).fill(0).map((v, i) => i)
}

function measurePingPong (connections) {
  return co(function * () {
    let start = Date.now()
    let pings = connections.map((connection) => {
      let tableTennis = connection.get('tableTennis')
      return tableTennis.ping()
    })
    yield Promise.all(pings)
    let end = Date.now()
    return end - start
  })
}

function record (table, number, time) {
  debug(`connections: ${number}, time: ${time}ms`)
  table.push([ number, time ])
}

function report (table) {
  console.log(`

 Result of measuring time returning Ping-Pong on many connections
`)
  console.log(table.toString())
}
