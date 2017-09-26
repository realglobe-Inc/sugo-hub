#!/usr/bin/env node

'use strict'

const SugoHub = require('../../lib/sugo_hub')

const sugoActor = require('sugo-actor')
const {Module} = sugoActor

;(async () => {
  const {port} = process.env
  const hub = new SugoHub({
    storage: `${__dirname}/../tmp/testing-local-storage-for-mock`,
    localActors: {
      'my-actor-01': sugoActor({
        modules: {
          say: new Module({
            sayYes: () => 'Yes from actor01'
          })
        }
      })
    }
  })

  await hub.listenAsCluster(port)

})().catch((e) => console.error(e))

