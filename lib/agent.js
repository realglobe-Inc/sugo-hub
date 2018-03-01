/**
 * Browser side agent for spot
 * @function agent
 */
'use strict'

const brequest = require('brequest')
const {HubUrls} = require('sugo-constants')
const {ACTOR_URL, CALLER_URL, OBSERVER_URL} = HubUrls

class SugoCloudAgent {
  constructor (url = null) {
    this.baseUrl = url
  }

  get (path, query) {
    let url = this.baseUrl ? this.baseUrl + path : path
    return brequest.get(url, query)
  }

  /**
   * List actors
   * @returns {Promise}
   */
  async actors () {
    const {body} = await this.get(ACTOR_URL, {})
    const {data, included} = body
    const includedDict = this._includedToDict(included)
    return data.map((data) => includedDict[data.type][data.id])
  }

  /**
   * List callers
   * @returns {Promise}
   */
  async callers () {
    const {body} = await this.get(CALLER_URL, {})
    const {data, included} = body
    const includedDict = this._includedToDict(included)
    return data.map((data) => includedDict[data.type][data.id])
  }

  _includedToDict (included) {
    const dict = {}
    for (const entry of included) {
      const {type, id} = entry
      dict[type] = dict[type] || {}
      dict[type][id] = entry.attributes
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
