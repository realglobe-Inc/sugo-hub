/**
 * Endpoints
 * @module Web api endpoint
 */

'use strict'

let d = (module) => module.default || module

module.exports = {
  get Endpoint () { return d(require('./endpoint')) },
  get SpotEndpoint () { return d(require('./spot_endpoint')) },
  get TerminalEndpoint () { return d(require('./terminal_endpoint')) }
}
