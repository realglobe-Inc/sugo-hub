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
    const key = keyForPid(pid)
    const invocation = new InvocationEntity({
      key,
      pid,
      caller: caller.key,
      callerSocket: caller.socketId,
      performedAt: new Date()
    })
    await this.save(invocation)
  }

  async finishInvocation (pid) {
    const key = keyForPid(pid)
    await this.destroy(key)
  }

  async findInvocation (pid) {
    const key = keyForPid(pid)
    return await this.find(key)
  }

  async findInvocationsForCaller (callerKey) {
    const {storage} = this
    const invocations = []
    const keys = await storage.hkeys(this.hkeyForEntities())
    for (let key of keys) {
      // TODO Speed up finding
      const invocation = JSON.parse(await storage.hget(this.hkeyForEntities(), key))
      const hit = invocation && invocation.caller === callerKey
      if (hit) {
        invocations.push(invocation)
      }
    }
    return invocations
  }

}

module.exports = InvocationService
