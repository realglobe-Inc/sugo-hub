/**
 * Entity for spot
 * @augments Entity
 * @class ActorEntity
 */
'use strict'

const Entity = require('./entity')

/** @lends ActorEntity */
class ActorEntity extends Entity {
  constructor (props = {}) {
    props = Object.assign({
      $specs: {},
      callers: []
    }, props)
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
