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
    defaults(props, {
      key: uuid.v4()
    })
    super(props)
  }
}

Object.assign(TerminalEntity, {
  $name: 'Terminal'
})

module.exports = TerminalEntity
