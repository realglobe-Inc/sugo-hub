/**
 * Namespace classes
 * @module namespaces
 */

'use strict'

let d = (module) => module.default || module

module.exports = {
  get ActorNamespace () { return d(require('./actor_namespace')) },
  get CallerNamespace () { return d(require('./caller_namespace')) },
  get Namespace () { return d(require('./namespace')) },
  get ObserverNamespace () { return d(require('./observer_namespace')) }
}
