/**
 * Services
 * @module services
 */

'use strict'

let d = (module) => module && module.default || module

module.exports = {
  get ActorService () { return d(require('./actor_service')) },
  get CallerService () { return d(require('./caller_service')) },
  get InvocationService () { return d(require('./invocation_service')) },
  get ObserverService () { return d(require('./observer_service')) },
  get Service () { return d(require('./service')) }
}
