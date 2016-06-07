/**
 * Entities
 * @module JSON compatible data holder
 */

'use strict'

let d = (module) => module.default || module

module.exports = {
  get Entity () { return d(require('./entity')) },
  get SpotEntity () { return d(require('./spot_entity')) },
  get TerminalEntity () { return d(require('./terminal_entity')) }
}
