/**
 * Mixin to setup local connections
 * @function localMixin
 * @param {function} BaseClass - Sub hub class
 * @returns {function} - Mixed class
 */
'use strict'

const {resolve: resolveUrl} = require('url')
const {HubUrls} = require('sugo-constants')
const asleep = require('asleep')
const {ACTOR_URL, CALLER_URL, OBSERVER_URL} = HubUrls

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
      const {port} = this
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
    async connectLocalActors (actors = {}) {
      await asleep(1)
      for (const key of Object.keys(actors)) {
        const actor = actors[key]
        const invalidKey = actor.key && (actor.key !== key)
        if (invalidKey) {
          throw new Error(`[SUGO-Hub] local actors has invalid key. ("${key}" as hash key and "${actor.key}" as actor property`)
        }
        actor.key = key
        actor.url = this.resolveLocalUrl(ACTOR_URL)
        await actor.connect()
      }
    }

    /**
     * Disconnect local actors
     * @returns {Promise}
     */
    async disconnectLocalActors (actors = {}) {
      for (const name of Object.keys(actors)) {
        const actor = actors[name]
        await actor.disconnect()
      }
    }
  }

  return LocalMixed
}

module.exports = localMixin
