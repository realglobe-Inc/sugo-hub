/**
 * Entity for caller
 * @class CallerEntity
 */
'use strict'

const Entity = require('./entity')

class CallerEntity extends Entity {
  constructor (props) {
    props = Object.assign({
      actors: [],
      invocations: []
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

  addInvocation (pid) {
    const s = this
    s.invocations.push(pid)
  }

  removeInvocation (pid) {
    const s = this
    let index = s.invocations.indexOf(pid)
    s.invocations.splice(index, 1)
  }

  hasInvocation (pid) {
    const s = this
    return !!~s.invocations.indexOf(pid)
  }

}

Object.assign(CallerEntity, {
  $name: 'Caller'
})

module.exports = CallerEntity
