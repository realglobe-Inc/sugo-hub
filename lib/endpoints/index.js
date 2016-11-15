/**
 * Endpoints
 * @module Web api endpoint
 */

'use strict'

let d = (module) => module && module.default || module

module.exports = {
  get ActorEndpoint () { return d(require('./actor_endpoint')) },
  get CallerEndpoint () { return d(require('./caller_endpoint')) },
  get Endpoint () { return d(require('./endpoint')) }
}
