/**
 * Event classes
 * @module events
 */

'use strict'

let d = (module) => module.default || module

module.exports = {
  get ActorEvents () { return d(require('./actor_events')) },
  get CallerEvents () { return d(require('./caller_events')) }
}
