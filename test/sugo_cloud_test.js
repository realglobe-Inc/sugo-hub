/**
 * Test case for sugoCloud.
 * Runs with mocha.
 */
'use strict'

const sugoCloud = require('../lib/sugo_cloud.js')
const sugoSpot = require('sugo-spot')
const sugoTerminal = require('sugo-terminal')
const sugoObserver = require('sugo-observer')
const apemanrequest = require('apemanrequest')
const assert = require('assert')
const co = require('co')
const http = require('http')

describe('sugo-cloud', function () {
  this.timeout(4000)
  let request = apemanrequest.create({ jar: true })
  before(() => co(function * () {

  }))

  after(() => co(function * () {

  }))

  it('Sugo cloud', () => co(function * () {
    let port = 9871

    let observed = []

    let cloud = yield sugoCloud({
      port,
      storage: `${__dirname}/../tmp/testing-cloud-storage`
    })

    let SPOT_URL = `http://localhost:${port}/spots`
    let TERMINAL_URL = `http://localhost:${port}/terminals`
    let OBSERVER_URL = `http://localhost:${port}/observers`

    let spot01 = sugoSpot(SPOT_URL, {
      key: 'my-spot-01',
      force: true,
      interfaces: {
        bash: require('sugo-spot/doc/mocks/mock-interface-bash.js')()
      }
    })

    let spot02 = sugoSpot(SPOT_URL, {
      key: 'my-spot-02',
      force: true,
      interfaces: {
        bash: require('sugo-spot/doc/mocks/mock-interface-bash.js')()
      }
    })

    let terminal01 = sugoTerminal(TERMINAL_URL, {})
    // let terminal02 = sugoTerminal(TERMINAL_URL, {})
    //
    yield spot01.connect()
    yield spot02.connect()

    let observer01 = sugoObserver(OBSERVER_URL, (data) => {
      observed.push(data)
    })

    yield observer01.start()

    // Perform an action
    {
      let connection = yield terminal01.connect(spot01.key)
      let bash = connection.bash()
      let payload = yield bash.spawn('ls', [ '-la' ])
      assert.equal(payload, 0, 'Exit with 0')
      yield connection.disconnect()
    }

    // Get spots info
    {
      let { body, statusCode } = yield request(SPOT_URL)
      assert.equal(statusCode, 200)
      assert.ok(body)
      let { meta, data, included } = body
      assert.ok(meta)
      assert.ok(data)
      assert.ok(included)
      data.forEach((data) => assert.equal(data.type, 'spots'))
    }

    // Get terminals info
    {
      let { body, statusCode } = yield request(TERMINAL_URL)
      assert.equal(statusCode, 200)
      assert.ok(body)
      let { meta, data, included } = body
      assert.ok(meta)
      assert.ok(data)
      assert.ok(included)
      data.forEach((data) => assert.equal(data.type, 'terminals'))
    }

    yield spot01.disconnect()
    yield spot02.disconnect()

    yield observer01.stop()

    yield new Promise((resolve) => setTimeout(resolve, 400))

    assert.ok(observed.length > 0)

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
