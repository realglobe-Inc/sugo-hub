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
      terminals: []
    })
  }

  addTerminal (terminal) {
    const s = this
    s.terminals.push(terminal.key)
  }

  removeTerminal (terminal) {
    const s = this
    let index = s.terminals.indexOf(terminal.key)
    s.terminals.splice(index, 1)
  }
}

Object.assign(SpotEntity, {
  $name: 'Spot'
})

module.exports = SpotEntity
