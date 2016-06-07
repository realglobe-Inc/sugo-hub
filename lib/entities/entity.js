/**
 * Abstract entity
 * @abstract
 * @class Entity
 */
'use strict'

class Entity {
  constructor (props) {
    const s = this
    Object.assign(s, props)
  }

  /**
   * Set values
   * @param {Object} values
   */
  set (values) {
    const s = this
    Object.assign(s, values)
  }

  /**
   * Delete value
   * @param {string} propName
   */
  del (propName) {
    const s = this
    delete s[ propName ]
  }

  /** Convert to json */
  toJSON () {
    throw new Error('Not implemented!')
  }
}

Object.assign(Entity, {
  /** Convert from json */
  fromJSON (data) {
    throw new Error('Not implemented')
  }
})

module.exports = Entity
