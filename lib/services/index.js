/**
 * Services
 * @module services
 */

'use strict'

const d = (module) => module && module.default || module

const ActorService = d(require('./actor_service'))
const CallerService = d(require('./caller_service'))
const InvocationService = d(require('./invocation_service'))
const ObserverService = d(require('./observer_service'))
const Service = d(require('./service'))

module.exports = {
  ActorService,
  CallerService,
  InvocationService,
  ObserverService,
  Service
}
