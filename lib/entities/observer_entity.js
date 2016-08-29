/**
 * Entity for observer
 * @class ObserverEntity
 */
'use strict'

const Entity = require('./entity')

class ObserverEntity extends Entity {
  constructor (props = {}) {
    props = Object.assign({}, props)
    super(props)
  }
}

Object.assign(ObserverEntity, {
  $name: 'Observer'
})

module.exports = ObserverEntity
