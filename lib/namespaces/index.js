/**
 * Namespace classes
 * @module namespaces
 */

'use strict'

let d = (module) => module.default || module

module.exports = {
  get Namespace () { return d(require('./namespace')) },
  get ObserverNamespace () { return d(require('./observer_namespace')) },
  get SpotNamespace () { return d(require('./spot_namespace')) },
  get TerminalNamespace () { return d(require('./terminal_namespace')) }
}
