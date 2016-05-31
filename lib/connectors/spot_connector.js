/**
 * @augments EventEmitter
 * @class SpotConnector
 */
'use strict'

const co = require('co')
const { EventEmitter } = require('events')
const { GreetingEvents, AcknowledgeStatus, RemoteEvents } = require('sg-socket-constants')

const { HI, BYE } = GreetingEvents
const { OK, NG } = AcknowledgeStatus

const uuid = require('uuid')

let ok = (payload) => ({ status: OK, payload })
let ng = (payload) => ({ status: NG, payload })
let noop = () => undefined

class SpotConnector extends EventEmitter {
  constructor (storage) {
    super()

    const s = this
    s.storage = storage.sub('spots')
    s.spots = {}
    s.onError = (err) => s.emit(err) || Promise.reject(err)
  }

  /**
   * Restore spots data from storage
   * @returns {Promise}
   */
  restore () {
    const s = this
    return co(function * () {
      s.spots = yield s.storage.all()
      s.spots = s.spots || {}
      return s
    }).catch(s.onError)
  }

  /**
   * Save spots data to storage
   * @returns {Promise}
   */
  save () {
    const s = this
    return co(function * () {
      for (let key of Object.keys(s.spots)) {
        let spot = s.spots[ key ]
        yield spot.set(key, spot)
      }
      return s
    }).catch(s.onError)
  }

  handleHi (socket, data = {}, callback = noop) {
    let { key, token } = data
    const s = this

    token = token || uuid.v4()

    let spot = s.getSpot(key)
    let invalidToken = spot.token && (spot.token !== token)
    if (invalidToken) {
      callback(ng(`Invalid token: ${token}`))
      return
    }
    if (!key) {
      callback(ng('key is required'))
      return
    }
    Object.assign(spot, {
      key, token,
      hiAt: new Date(),
      socketId: socket.id
    })
    s.saveSpot(key, spot)
    callback(ok({ key, token }))
  }

  handleBye (socket, data = {}, callback = noop) {
    const s = this

    let spot = s.getSpotBySocketId(socket.id)
    if (!spot) {
      callback(ng('Invalid id'))
      return
    }

    let { token } = data
    let invalidToken = spot.token && (spot.token !== token)
    if (invalidToken) {
      callback(ng(`Invalid token: ${token}`))
      return
    }

    Object.assign(spot, {
      byeAt: new Date()
    })
    s.saveSpot(spot.key, spot)

    callback(ok(spot.key))
  }

  getSpot (key) {
    const s = this
    return s.spots[ key ] || {}
  }

  getSpotBySocketId (socketId) {
    const s = this
    for (let key of Object.keys(s.spots)) {
      let spot = s.spots[ key ]
      var hit = spot.socketId === socketId
      if (hit) {
        return spot
      }
    }
    return null
  }

  saveSpot (key, spot) {
    const s = this
    s.spots[ key ] = spot
    s.storage.set(key, spot)
  }
}

module.exports = SpotConnector
