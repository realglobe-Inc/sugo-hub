/**
 * Define an endpoint for info
 * @function infoEndpoint
 */
'use strict'

const co = require('co')
const debug = require('debug')('sg:cloud:info')

/** @lends infoEndpoint */
function infoEndpoint (scope) {
  let { spotService, terminalService } = scope
  return {
    'GET': co.wrap(function * info (ctx) {
      let spots = yield spotService.info()
      let terminals = yield terminalService.info()
      // Return with JSON-API compatible format.
      ctx.body = {
        meta: {
          spots: spots.length,
          terminals: terminals.length
        },
        data: {
          spots: spots.map((spot) => ({ type: 'spots', id: spot.key })),
          terminals: terminals.map((terminal) => ({ type: 'terminals', id: terminal.key }))
        },
        included: [
          ...spots.map((spot) => ({ type: 'spots', id: spot.key, attributes: spot })),
          ...terminals.map((terminal) => ({ type: 'terminals', id: terminal.key, attributes: terminal }))
        ]
      }
    })
  }
}

module.exports = infoEndpoint
