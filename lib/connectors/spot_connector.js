/**
 * @class SpotConnector
 */
'use strict'

const co = require('co')
const sgSocketConstants = require('sg-socket-constants')
const { EventEmitter } = require('events')

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

  handleHi (socket, data) {
    const { HI, REJECTION } = sgSocketConstants.SpotEvents

    let { key, token } = data
    const s = this

    let spot = s._getSpot(key)
    let invalidToken = spot.token && (spot.token !== token)
    if (invalidToken) {
      socket.emit(REJECTION)
      return
    }
    Object.assign(spot, {
      key, token, hiAt: new Date()
    })
    s._saveSpot(key, spot)
    socket.emit(HI)
  }

  handleBye (socket, data) {
    const { BYE, REJECTION } = sgSocketConstants.SpotEvents
    const s = this

    let spot = s._getSpotById(socket.id)
    if (!spot) {
      socket.emit(REJECTION)
      return
    }
    Object.assign(spot, {
      byeAt: new Date()
    })
    s._saveSpot(spot.key, spot)
    socket.emit(BYE)
  }

  handleAbout (socket, data) {
    const s = this
    const { REJECTION } = sgSocketConstants.SpotEvents

    let spot = s._getSpotById(socket.id)
    if (!spot) {
      socket.emit(REJECTION)
      return
    }
    Object.assign(spot, {
      about: data
    })
    s._saveSpot(spot.key, spot)
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
