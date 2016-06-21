/**
 * Define an endpoint for spot
 * @class SpotEndpoint
 */
'use strict'

const co = require('co')
const Endpoint = require('./endpoint')
const ApiFormat = require('../helpers/api_format')
/** @lends SpotEndpoint */
class SpotEndpoint extends Endpoint {
  /** Endpoint for list spot data */
  list () {
    const s = this
    let { scope } = s
    let { spotService } = scope
    let { Entity } = spotService
    return co.wrap(function * list (ctx) {
      let spots = yield spotService.info()
      // Return with JSON-API compatible format.
      ctx.body = {
        meta: { count: spots.length },
        data: spots.map((spot) => ApiFormat.resourceIdentifier(Entity, spot)),
        included: spots.map((spot) => ApiFormat.resource(Entity, spot))
      }
    })
  }
}

module.exports = SpotEndpoint
