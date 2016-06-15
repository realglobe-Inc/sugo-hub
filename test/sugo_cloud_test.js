/**
 * Test case for sugoCloud.
 * Runs with mocha.
 */
'use strict'

const sugoCloud = require('../lib/sugo_cloud.js')
const sugoSpot = require('sugo-spot')
const sugoTerminal = require('sugo-terminal')
const sgSocketClient = require('sg-socket-client')
const assert = require('assert')
const co = require('co')
const { GreetingEvents, RemoteEvents } = require('sg-socket-constants')
let { HI, BYE } = GreetingEvents
const http = require('http')

describe('sugo-cloud', function () {
  this.timeout(4000)
  before(() => co(function * () {

  }))

  after(() => co(function * () {

  }))

  it('Sugo cloud', () => co(function * () {
    let port = 9871

    let cloud = yield sugoCloud({
      port,
      storage: `${__dirname}/../tmp/testing-cloud-storage`
    })

    let SPOT_URL = `http://localhost:${port}/spots`
    let TERMINAL_URL = `http://localhost:${port}/terminals`

    let spot01 = sugoSpot(SPOT_URL, {
      key: 'my-spot-01',
      interfaces: {
        bash: require('sugo-spot/doc/mocks/mock-interface-bash.js')()
      }
    })
    let spot02 = sugoSpot(SPOT_URL, {
      key: 'my-spot-02',
      interfaces: {
        bash: require('sugo-spot/doc/mocks/mock-interface-bash.js')()
      }
    })

    let terminal01 = sugoTerminal(TERMINAL_URL, {})
    let terminal02 = sugoTerminal(TERMINAL_URL, {})
    //
    yield spot01.connect()
    yield spot02.connect()

    // Perform an action
    {
      let connection = yield terminal01.connect(spot01.key)
      let bash = connection.bash()
      let { payload } = yield bash.spawn('ls', [ '-la' ])
      assert.equal(payload, 0, 'Exit with 0')
      yield connection.disconnect()
    }

    yield spot01.disconnect()
    yield spot02.disconnect()

    yield cloud.close()
  }))

  it('Create from custom http server.', () => co(function * () {
    let port = 9872
    let cloud = yield sugoCloud({
      port,
      server: http.createServer((req, res, next) => {

      })
    })
    assert.equal(cloud.port, port)
    yield cloud.close()
  }))
})

/* global describe, before, after, it */
