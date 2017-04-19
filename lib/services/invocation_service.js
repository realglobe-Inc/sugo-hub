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
      indices: [],
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

  findInvocationsForCaller (callerKey) {
    const s = this
    let { storage } = s
    return co(function * () {
      let invocations = []
      let keys = yield storage.hkeys(s.hkeyForEntities())
      for (let key of keys) {
        // TODO Speed up finding
        let invocation = JSON.parse(yield storage.hget(s.hkeyForEntities(), key))
        let hit = invocation.caller === callerKey
        if (hit) {
          invocations.push(invocation)
        }
      }
      return invocations
    })
  }

}

module.exports = InvocationService
