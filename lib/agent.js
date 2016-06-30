/**
 * Browser side agent for spot
 * @function agent
 */
'use strict'

const co = require('co')

const apRequest = require('apeman-brws-request')
const { SPOT_URL, TERMINAL_URL, OBSERVER_URL } = require('./constants/url_constants')

class SugoCloudAgent {
  constructor () {
    const s = this
  }

  get (...args) {
    return apRequest.get(...args)
  }

  /**
   * List spots
   * @returns {Promise}
   */
  spots () {
    const s = this
    return co(function * () {
      let { body } = yield s.get(SPOT_URL, {})
      let { data, included } = body
      let includedDict = s._includedToDict(included)
      return data.map((data) => includedDict[ data.type ][ data.id ])
    })
  }

  /**
   * List terminals
   * @returns {Promise}
   */
  terminals () {
    const s = this
    return co(function * () {
      let { body } = yield s.get(TERMINAL_URL, {})
      let { data, included } = body
      let includedDict = s._includedToDict(included)
      return data.map((data) => includedDict[ data.type ][ data.id ])
    })
  }

  _includedToDict (included) {
    let dict = {}
    for (let entry of included) {
      let { type, id } = entry
      dict[ type ] = dict[ type ] || {}
      dict[ type ][ id ] = entry.attributes
    }
    return dict
  }
}

/** @lends agent */
function agent () {
  return new SugoCloudAgent()
}

module.exports = agent
