/**
 * @class SpotConnector
 */
'use strict'

const co = require('co')
const { GreetingEvents, AcknowledgeStatus, RemoteEvents } = require('sg-socket-constants')
const { EventEmitter } = require('events')

const { HI, BYE } = GreetingEvents
const { OK, NG } = AcknowledgeStatus

let ok = (payload) => ({ status: OK, payload })
let ng = (payload) => ({ status: NG, payload })
let noop = () => undefined

class SpotConnector extends EventEmitter {
  constructor (storage) {
    super()

    const s = this
    s.storage = storage
    s.spots = null

    s.onError = (err) => s.emit(err) || Promise.reject(err)
  }

  /**
   * Restore spots data from storage
   * @returns {Promise}
   */
  restore () {
    const s = this
    return co(function * () {
      s.spots = yield s.storage.get('spots')
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
      yield s.storage.set('spots', s.spots)
      return s
    }).catch(s.onError)
  }

  handleHi (socket, data = {}, callback = noop) {
    let { key, token } = data
    const s = this

    let spot = s._getSpot(key)
    let invalidToken = spot.token && (spot.token !== token)
    if (invalidToken) {
      callback(ng('Invalid token'))
      return
    }
    Object.assign(spot, {
      key, token, hiAt: new Date()
    })
    s._saveSpot(key, spot)
    callback(ok(key))
  }

  handleBye (socket, data = {}, callback = noop) {
    const s = this

    let spot = s._getSpotById(socket.id)
    if (!spot) {
      callback(ng('Invalid id'))
      return
    }
    Object.assign(spot, {
      byeAt: new Date()
    })
    s._saveSpot(spot.key, spot)
    callback(ok(spot.key))
  }

  _getSpot (key) {
    const s = this
    return s.spots[ key ] || {}
  }

  _getSpotById (id) {
    const s = this
    for (let key of Object.keys(s.spots)) {
      let spot = s.spots[ key ]
      var hit = spot.id === id
      if (hit) {
        return spot
      }
    }
    return null
  }

  _saveSpot (key, spot) {
    const s = this
    s.spots[ key ] = spot
    s.save() // No wait
  }
}

module.exports = SpotConnector
