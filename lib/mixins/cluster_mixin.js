/**
 * Mixin to setup cluster
 * @function clusterMixin
 */
'use strict'

const {asleep} = require('asleep')
const {isMaster, workers, fork} = require('cluster')

/** @lends clusterMixin */
function clusterMixin (BaseClass) {
  class ClusterMixed extends BaseClass {

    get $$clusterMixed () {
      return true
    }

    async newClusterWorker (env) {
      const worker = fork(env)
      worker.on('exit', () => {
        console.log(`worker ${worker.process.pid} died`)
      })
      return new Promise((resolve, reject) => {
        worker.on('listening', () => resolve())
        worker.on('error', (e) => reject(e))
      })
    }

    async listenAsCluster (port, callback) {
      const s = this
      const {
        server,
        localActors
      } = s
      if (!port) {
        port = s.port
      }
      s.port = port
      if (isMaster) {

        // TODO Multiple instances
        await Promise.all([
          s.newClusterWorker({SUGOS_CLUSTER_HUB: 1})
        ])
        callback && callback()
        await Promise.all(
          Object.keys(localActors).map((name) =>
            s.newClusterWorker({SUGOS_CLUSTER_ACTOR: name})
          )
        )
      } else {
        const {SUGOS_CLUSTER_HUB, SUGOS_CLUSTER_ACTOR} = process.env
        if (SUGOS_CLUSTER_ACTOR) {
          const actor = localActors[SUGOS_CLUSTER_ACTOR]
          if (actor) {
            await s.connectLocalActors({[SUGOS_CLUSTER_ACTOR]: actor})
          }
        }
        if (SUGOS_CLUSTER_HUB) {
          await server.listen(port)
        }
      }
      s.listening = true
    }

    async closeAsCluster () {
      const s = this
      const {
        server,
        localActors
      } = s
      if (isMaster) {

      } else {
        const {SUGOS_CLUSTER_ACTOR, SUGOS_CLUSTER_HUB} = process.env
        if (SUGOS_CLUSTER_ACTOR) {
          const actor = SUGOS_CLUSTER_ACTOR && localActors[SUGOS_CLUSTER_ACTOR]
          if (actor) {
            await s.disconnectLocalActors({[SUGOS_CLUSTER_ACTOR]: actor})
          }
        }
        if (SUGOS_CLUSTER_HUB) {
          await asleep(100)
          await server.close()
          await asleep(10)
        }
      }
      s.listening = false
    }

  }

  return ClusterMixed
}

module.exports = clusterMixin