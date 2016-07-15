/**
 * Define an endpoint for caller
 * @class CallerEndpoint
 */
'use strict'

const co = require('co')
const Endpoint = require('./endpoint')
const ApiFormat = require('../helpers/api_format')
/** @lends CallerEndpoint */
class CallerEndpoint extends Endpoint {
  /** Endpoint for list caller data */
  list () {
    const s = this
    let { scope } = s
    let { callerService } = scope
    let { Entity } = callerService
    return co.wrap(function * list (ctx) {
      let callers = yield callerService.info()
      // Return with JSON-API compatible format.
      ctx.body = {
        meta: { count: callers.length },
        data: callers.map((caller) => ApiFormat.resourceIdentifier(Entity, caller)),
        included: callers.map((caller) => ApiFormat.resource(Entity, caller))
      }
    })
  }
}

module.exports = CallerEndpoint
