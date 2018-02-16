/**
 * Connector classes
 * @module connectors
 */

'use strict'

const d = (module) => module && module.default || module

const ActorConnector = d(require('./actor_connector'))
const CallerConnector = d(require('./caller_connector'))
const Connector = d(require('./connector'))
const ObserverConnector = d(require('./observer_connector'))

module.exports = {
  ActorConnector,
  CallerConnector,
  Connector,
  ObserverConnector
}
