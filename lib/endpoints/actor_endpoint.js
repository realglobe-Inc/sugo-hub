/**
 * Define an endpoint for actor
 * @class ActorEndpoint
 */
'use strict'

const Endpoint = require('./endpoint')
const ApiFormat = require('../helpers/api_format')

/** @lends ActorEndpoint */
class ActorEndpoint extends Endpoint {
  /** Endpoint for list actor data */
  list () {
    const s = this
    const {scope} = s
    const {actorService} = scope
    const {Entity} = actorService
    return async function list (ctx) {
      let actors = await actorService.info()
      // Return with JSON-API compatible format.
      ctx.body = {
        meta: {count: actors.length},
        data: actors.map((actor) => ApiFormat.resourceIdentifier(Entity, actor)),
        included: actors.map((actor) => ApiFormat.resource(Entity, actor))
      }
    }
  }
}

module.exports = ActorEndpoint
