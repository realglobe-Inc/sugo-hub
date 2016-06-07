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
    if (!s.key) {
      throw new Error('key is required.')
    }
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
}

Object.assign(Entity, {
})

module.exports = Entity
