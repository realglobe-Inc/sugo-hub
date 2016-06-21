/**
 * Event classes
 * @module events
 */

'use strict'

let d = (module) => module.default || module

module.exports = {
  get SpotEvents () { return d(require('./spot_events')) },
  get TerminalEvents () { return d(require('./terminal_events')) }
}
