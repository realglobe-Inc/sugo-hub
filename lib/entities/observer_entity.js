/**
 * Entity for observer
 * @augments Entity
 * @class ObserverEntity
 */
'use strict'

const Entity = require('./entity')

/** @lends ObserverEntity */
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
