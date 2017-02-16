/**
 * mixins
 * @module Sugo hub mixins
 */

'use strict'

let d = (module) => module && module.default || module

module.exports = {
  get localMixin () { return d(require('./local_mixin')) }
}
