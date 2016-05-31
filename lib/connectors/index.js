/**
 * Connectors
 * @module connectors
 */

'use strict'

let d = (module) => module.default || module

module.exports = {
  get SpotConnector () { return d(require('./spot_connector')) },
  get TerminalConnector () { return d(require('./terminal_connector')) }
}
