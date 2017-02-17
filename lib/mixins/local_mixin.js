/**
 * Mixin to setup local connections
 * @function localMixin
 * @param {function} BaseClass - Sub hub class
 * @returns {function} - Mixed class
 */
'use strict'

const co = require('co')
const { resolve: resolveUrl } = require('url')
const { HubUrls } = require('sugo-constants')
const { ACTOR_URL, CALLER_URL, OBSERVER_URL } = HubUrls

/** @lends localMixin */
function localMixin (BaseClass) {
  class LocalMixed extends BaseClass {

    get $$localMixed () {
      return true
    }

    /**
     * Resolve local url for this hub
     * @param {string} pathname - Path name to resolve
     * @returns {string} - Resolved url
     */
    resolveLocalUrl (pathname) {
      const s = this
      const { port } = s
      if (!port) {
        throw new Error('[SUGO-Hub] Could not resolve local url since no port found')
      }
      return resolveUrl(`http://localhost:${port}`, pathname)
    }

    /**
     * Connect local actors
     * @param {Object} actors
     * @returns {Promise}
     */
    connectLocalActors (actors = {}) {
      const s = this
      return co(function * () {
        for (let key of Object.keys(actors)) {
          let actor = actors[ key ]
          let invalidKey = actor.key && (actor.key !== key)
          if (invalidKey) {
            throw new Error(`[SUGO-Hub] local actors has invalid key. ("${key}" as hash key and "${actor.key}" as actor property`)
          }
          actor.key = key
          actor.url = s.resolveLocalUrl(ACTOR_URL)
          yield actor.connect()
        }
      })
    }

    /**
     * Disconnect local actors
     * @returns {Promise}
     */
    disconnectLocalActors (actors = {}) {
      const s = this
      return co(function * () {
        for (let name of Object.keys(actors)) {
          let actor = actors[ name ]
          yield actor.disconnect()
        }
      })
    }
  }
  return LocalMixed
}

module.exports = localMixin
