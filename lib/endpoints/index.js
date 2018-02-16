/**
 * Endpoints
 * @module Web api endpoint
 */

'use strict'

const d = (module) => module && module.default || module

const ActorEndpoint = d(require('./actor_endpoint'))
const CallerEndpoint = d(require('./caller_endpoint'))
const Endpoint = d(require('./endpoint'))

module.exports = {
  ActorEndpoint,
  CallerEndpoint,
  Endpoint
}
