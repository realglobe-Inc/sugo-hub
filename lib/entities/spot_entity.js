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
    defaults(s, {
      $specs: {},
      terminals: {}
    })
  }
}

Object.assign(SpotEntity, {
  $name: 'Spot'
})

module.exports = SpotEntity
