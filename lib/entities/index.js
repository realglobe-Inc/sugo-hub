/**
 * Entities
 * @module JSON compatible data holder
 */

'use strict'

let d = (module) => module && module.default || module

module.exports = {
  get ActorEntity () { return d(require('./actor_entity')) },
  get CallerEntity () { return d(require('./caller_entity')) },
  get Entity () { return d(require('./entity')) },
  get InvocationEntity () { return d(require('./invocation_entity')) },
  get ObserverEntity () { return d(require('./observer_entity')) }
}
