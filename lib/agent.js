/**
 * Browser side agent for spot
 * @function agent
 */
'use strict'

const co = require('co')

const apRequest = require('apeman-brws-request')
const { SPOT_URL, TERMINAL_URL, OBSERVER_URL } = require('./constants/url_constants')

class SugoCloudAgent {
  constructor (url = null) {
    const s = this
    s.baseUrl = url
  }

  get (path, query) {
    const s = this
    let url = s.baseUrl ? s.baseUrl + path : path
    return apRequest.get(url, query)
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
function agent (url) {
  return new SugoCloudAgent(url)
}

module.exports = agent
