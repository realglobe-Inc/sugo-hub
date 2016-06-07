/**
 * Entity for terminal
 * @class TerminalEntity
 */
'use strict'

const Entity = require('./entity')
const defaults = require('defaults')

class TerminalEntity extends Entity {
  constructor (props) {
    defaults(props, {
      spots: []
    })
    super(props)
  }

  addSpot (spot) {
    const s = this
    s.spots.push(spot.key)
  }

  removeSpot (spot) {
    const s = this
    let index = s.spots.indexOf(spot.key)
    s.spots.splice(index, 1)
  }

}

Object.assign(TerminalEntity, {
  $name: 'Terminal'
})

module.exports = TerminalEntity
