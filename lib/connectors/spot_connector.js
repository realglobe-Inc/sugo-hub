/**
 * @augments EventEmitter
 * @class SpotConnector
 */
'use strict'

const Connector = require('./connector')
const co = require('co')

const { GreetingEvents, AcknowledgeStatus, RemoteEvents } = require('sg-socket-constants')

const { HI, BYE } = GreetingEvents
const { OK, NG } = AcknowledgeStatus

const uuid = require('uuid')

let ok = (payload) => ({ status: OK, payload })
let ng = (payload) => {
  return ({ status: NG, payload: String(payload) })
}
let noop = () => undefined

class SpotConnector extends Connector {
  constructor (storage) {
    super(storage)
  }

  handleHi (socket, data = {}, callback = noop) {
    const s = this
    let { key, token } = data

    return co(function * () {
      token = token || uuid.v4()
      let spot = yield s.getSpot(key)
      spot = spot || {}
      let invalidToken = spot.token && (spot.token !== token)
      if (invalidToken) {
        throw new Error(`Invalid token: ${token}`)
      }
      if (!key) {
        throw new Error('key is required')
      }
      Object.assign(spot, {
        key, token,
        hiAt: new Date(),
        socketId: socket.id
      })
      yield s.saveSpot(key, spot)
      return { key, token }
    })
      .then((result) => callback(ok(result)))
      .catch((err) => callback(ng(err)))
  }

  handleBye (socket, data = {}, callback = noop) {
    const s = this

    return co(function * () {
      let spot = yield s.getSpotBySocketId(socket.id)
      if (!spot) {
        throw new Error('Invalid id')
      }

      let { token } = data
      let invalidToken = spot.token && (spot.token !== token)
      if (invalidToken) {
        throw new Error(`Invalid token: ${token}`)
      }

      Object.assign(spot, {
        byeAt: new Date()
      })
      let { key, socketId } = spot
      delete spot.token
      yield s.saveSpot(key, spot)
      yield s.clearSpotSocketId(socketId)

      return { key }
    })
      .then((result) => callback(ok(result)))
      .catch((err) => callback(ng(err)))
  }

  getSpot (key) {
    const s = this
    let { storage } = s
    return co(function * () {
      let data = yield storage.hget('sg:spot', key)
      return data && JSON.parse(data)
    })
  }

  getSpotBySocketId (socketId) {
    const s = this
    let { storage } = s
    return co(function * () {
      let key = yield storage.hget('sg:spot:sockets', socketId)
      if (key) {
        return yield s.getSpot(key)
      }
      throw new Error(`Unknown socket: ${socketId}`)
    })
  }

  saveSpot (key, spot) {
    const s = this
    let { storage } = s
    return co(function * () {
      yield storage.hset('sg:spot', key, JSON.stringify(spot))
      yield storage.hset('sg:spot:sockets', spot.socketId, spot.key)
    })
  }

  clearSpotSocketId (socketId) {
    const s = this
    let { storage } = s
    return co(function * () {
      yield storage.hdel('sg:spot:sockets', socketId)
    })
  }
}

module.exports = SpotConnector
