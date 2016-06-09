/**
 * Services
 * @module services
 */

'use strict'

let d = (module) => module.default || module

module.exports = {
  get Service () { return d(require('./service')) },
  get SpotService () { return d(require('./spot_service')) },
  get TerminalService () { return d(require('./terminal_service')) }
}