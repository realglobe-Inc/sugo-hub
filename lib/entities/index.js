/**
 * Entities
 * @module JSON compatible data holder
 */

'use strict'

const d = (module) => module && module.default || module

const ActorEntity = d(require('./actor_entity'))
const CallerEntity = d(require('./caller_entity'))
const Entity = d(require('./entity'))
const InvocationEntity = d(require('./invocation_entity'))
const ObserverEntity = d(require('./observer_entity'))

module.exports = {
  ActorEntity,
  CallerEntity,
  Entity,
  InvocationEntity,
  ObserverEntity
}
