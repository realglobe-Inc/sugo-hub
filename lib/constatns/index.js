/**
 * Constants
 * @module Constant values
 */

'use strict'

let d = (module) => module.default || module

module.exports = {
  get UrlConstants () { return d(require('./url_constants')) }
}
