/**
 * Entity for terminal
 * @class TerminalEntity
 */
'use strict'

const Entity = require('./entity')
const uuid = require('uuid')
const defaults = require('defaults')

class TerminalEntity extends Entity {
  constructor (props) {
    super(props)
    const s = this
    defaults(s, {
      key: uuid.v4()
    })
  }

  /**
   * Convert to json
   * @override
   */
  toJSON () {
    const s = this
    return Object.assign(s, {})
  }
}

Object.assign(TerminalEntity, {
  /**
   * Convert from json
   * @override
   * @param data
   * @returns {TerminalEntity}
   */
  fromJSON (data) {
    return new TerminalEntity(data)
  }
})

module.exports = TerminalEntity
