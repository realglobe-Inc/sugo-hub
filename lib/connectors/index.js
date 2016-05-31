/**
 * Connectors
 * @module connectors
 */

'use strict'

let d = (module) => module.default || module

module.exports = {
  get Connector () { return d(require('./connector')) },
  get SpotConnector () { return d(require('./spot_connector')) },
  get TerminalConnector () { return d(require('./terminal_connector')) }
}
