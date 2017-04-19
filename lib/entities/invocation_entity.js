/**
 * Entity for invocation
 * @class InvocationEntity
 */
'use strict'

const Entity = require('./entity')

class InvocationEntity extends Entity {
  constructor (props) {
    props = Object.assign({
      pid: null,
      performedAt: new Date()
    }, props)
    super(props)
  }
}

Object.assign(InvocationEntity, {
  $name: 'Invocation'
})

module.exports = InvocationEntity
