/**
 * Service for invocations
 * @augments Service
 * @class InvocationService
 */
'use strict'

const Service = require('./service')
const co = require('co')

const { InvocationEntity } = require('../entities')

const keyForPid = (pid) => String(pid)

/** @lends InvocationService */
class InvocationService extends Service {
  constructor (storage) {
    super(storage, {
      prefix: 'sg:invocation',
      indices: [ 'caller' ],
      entity: 'InvocationEntity'
    })
  }

  beginInvocation (pid, caller) {
    const s = this
    return co(function * () {
      let key = keyForPid(pid)
      let invocation = new InvocationEntity({
        key,
        pid,
        caller: caller.key,
        callerSocket: caller.socketId,
        performedAt: new Date()
      })
      yield s.save(invocation)
    })
  }

  finishInvocation (pid) {
    const s = this
    let key = keyForPid(pid)
    return co(function * () {
      yield s.destroy(key)
    })
  }

  findInvocation (pid) {
    const s = this
    let key = keyForPid(pid)
    return co(function * () {
      return yield s.find(key)
    })
  }

  /**
   * Find by caller key
   * @param {string} callerKey
   * @param {Object} [options={}] - Optional settings
   * @returns {Promise}
   */
  findByCallerKey (callerKey, options = {}) {
    const s = this
    return co(function * () {
      return yield s.findByIndex('caller', callerKey, options)
    })
  }

}

module.exports = InvocationService
