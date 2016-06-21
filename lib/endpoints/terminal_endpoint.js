/**
 * Define an endpoint for terminal
 * @class TerminalEndpoint
 */
'use strict'

const co = require('co')
const Endpoint = require('./endpoint')
const ApiFormat = require('../helpers/api_format')
/** @lends TerminalEndpoint */
class TerminalEndpoint extends Endpoint {
  /** Endpoint for list terminal data */
  list () {
    const s = this
    let { scope } = s
    let { terminalService } = scope
    let { Entity } = terminalService
    return co.wrap(function * list (ctx) {
      let terminals = yield terminalService.info()
      // Return with JSON-API compatible format.
      ctx.body = {
        meta: { count: terminals.length },
        data: terminals.map((terminal) => ApiFormat.resourceIdentifier(Entity, terminal)),
        included: terminals.map((terminal) => ApiFormat.resource(Entity, terminal))
      }
    })
  }
}

module.exports = TerminalEndpoint
