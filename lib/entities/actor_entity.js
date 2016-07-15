/**
 * Entity for spot
 * @class ActorEntity
 */
'use strict'

const Entity = require('./entity')
const defaults = require('defaults')

class ActorEntity extends Entity {
  constructor (props) {
    defaults(props, {
      $specs: {},
      callers: []
    })
    super(props)
  }

  addCaller (caller) {
    const s = this
    s.callers.push(caller.key)
  }

  removeCaller (caller) {
    const s = this
    let index = s.callers.indexOf(caller.key)
    s.callers.splice(index, 1)
  }
}

Object.assign(ActorEntity, {
  $name: 'Actor'
})

module.exports = ActorEntity
