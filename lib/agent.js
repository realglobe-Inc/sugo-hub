/**
 * Browser side agent for spot
 * @function agent
 */
'use strict'

const brequest = require('brequest')
const { HubUrls } = require('sugo-constants')
const { ACTOR_URL, CALLER_URL, OBSERVER_URL } = HubUrls

class SugoCloudAgent {
  constructor (url = null) {
    const s = this
    s.baseUrl = url
  }

  get (path, query) {
    const s = this
    let url = s.baseUrl ? s.baseUrl + path : path
    return brequest.get(url, query)
  }

  /**
   * List actors
   * @returns {Promise}
   */
  async actors () {
    const s = this
      let { body } = await s.get(ACTOR_URL, {})
      let { data, included } = body
      let includedDict = s._includedToDict(included)
      return data.map((data) => includedDict[ data.type ][ data.id ])
  }

  /**
   * List callers
   * @returns {Promise}
   */
  async callers () {
    const s = this
      let { body } = await s.get(CALLER_URL, {})
      let { data, included } = body
      let includedDict = s._includedToDict(included)
      return data.map((data) => includedDict[ data.type ][ data.id ])
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

Object.assign(agent, {
  SugoCloudAgent
})

module.exports = agent
