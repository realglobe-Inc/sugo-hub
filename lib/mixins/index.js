/**
 * mixins
 * @module Sugo hub mixins
 */

'use strict'

const d = (module) => module && module.default || module

const clusterMixin = d(require('./cluster_mixin'))
const localMixin = d(require('./local_mixin'))

module.exports = {
  clusterMixin,
  localMixin
}
