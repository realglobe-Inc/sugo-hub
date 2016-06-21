/**
 * Endpoints
 * @module Web api endpoint
 */

'use strict'

let d = (module) => module.default || module

module.exports = {
  get infoEndpoint () { return d(require('./info_endpoint')) }
}
