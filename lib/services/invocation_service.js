/**
 * Service for invocations
 * @augments Service
 * @class InvocationService
 */
'use strict'

const Service = require('./service')
const {InvocationEntity} = require('../entities')

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

  async beginInvocation (pid, caller) {
    const s = this
    const key = keyForPid(pid)
    const invocation = new InvocationEntity({
      key,
      pid,
      caller: caller.key,
      callerSocket: caller.socketId,
      performedAt: new Date()
    })
    await s.save(invocation)
  }

  async finishInvocation (pid) {
    const s = this
    let key = keyForPid(pid)
    await s.destroy(key)
  }

  async findInvocation (pid) {
    const s = this
    let key = keyForPid(pid)
    return await s.find(key)
  }

  async findInvocationsForCaller (callerKey) {
    const s = this
    let {storage} = s
    let invocations = []
    let keys = await storage.hkeys(s.hkeyForEntities())
    for (let key of keys) {
      // TODO Speed up finding
      let invocation = JSON.parse(await storage.hget(s.hkeyForEntities(), key))
      let hit = invocation.caller === callerKey
      if (hit) {
        invocations.push(invocation)
      }
    }
    return invocations
  }

}

module.exports = InvocationService
