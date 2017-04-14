/**
 * Connector classes
 * @module connectors
 */

'use strict'

let d = (module) => module && module.default || module

module.exports = {
  get ActorConnector () { return d(require('./actor_connector')) },
  get CallerConnector () { return d(require('./caller_connector')) },
  get Connector () { return d(require('./connector')) },
  get ObserverConnector () { return d(require('./observer_connector')) }
}
