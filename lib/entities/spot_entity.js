/**
 * Entity for spot
 * @class SpotEntity
 */
'use strict'

const Entity = require('./entity')
const defaults = require('defaults')

class SpotEntity extends Entity {
  constructor (props) {
    super(props)
    const s = this
    if (!s.key) {
      throw new Error('key is required.')
    }
    defaults(s, {
      $specs: {},
      terminals: {}
    })
  }

  /**
   * Convert to json
   * @override
   */
  toJSON () {
    const s = this
    return Object.assign({}, s)
  }
}

Object.assign(SpotEntity, {
  /**
   * Convert from json
   * @override
   * @param data
   * @returns {SpotEntity}
   */
  fromJSON (data) {
    if (typeof data === 'string') {
      data = JSON.parse(data)
    }
    return new SpotEntity(data)
  }
})

module.exports = SpotEntity
