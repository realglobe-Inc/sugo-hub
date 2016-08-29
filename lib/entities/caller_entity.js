/**
 * Entity for caller
 * @class CallerEntity
 */
'use strict'

const Entity = require('./entity')

class CallerEntity extends Entity {
  constructor (props) {
    props = Object.assign({
      actors: []
    }, props)
    super(props)
  }

  addActor (actor) {
    const s = this
    s.actors.push(actor.key)
  }

  removeActor (actor) {
    const s = this
    let index = s.actors.indexOf(actor.key)
    s.actors.splice(index, 1)
  }

}

Object.assign(CallerEntity, {
  $name: 'Caller'
})

module.exports = CallerEntity
