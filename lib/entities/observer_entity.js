/**
 * Entity for observer
 * @class ObserverEntity
 */
'use strict'

const Entity = require('./entity')
const defaults = require('defaults')

class ObserverEntity extends Entity {
  constructor (props) {
    defaults(props, {})
    super(props)
  }
}

Object.assign(ObserverEntity, {
  $name: 'Observer'
})

module.exports = ObserverEntity
