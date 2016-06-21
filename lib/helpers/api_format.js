/**
 * Format data to conform JSON-API
 * @module ApiFormat
 * @see http://jsonapi.org/format/
 */
'use strict'

const inflection = require('inflection')
const stringcase = require('stringcase')

/** @lends ApiFormat */
module.exports = Object.assign(exports, {
  /**
   * Get type of resource
   * @param Entity
   * @returns {string}
   */
  resourceType (Entity) {
    let { $name } = Entity
    return inflection.pluralize(stringcase.snakecase($name))
  },
  /**
   * Create resource identifier of JSON-API
   * @param Entity
   * @param entity
   */
  resourceIdentifier (Entity, entity) {
    let type = exports.resourceType(Entity)
    return { type, id: entity.key }
  },
  /**
   * Create resource data
   * @param Entity
   * @param entity
   */
  resource (Entity, entity) {
    let identifier = exports.resourceIdentifier(Entity, entity)
    return Object.assign(identifier, { attributes: entity })
  }
})
