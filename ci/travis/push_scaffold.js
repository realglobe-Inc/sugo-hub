#!/usr/bin/env node

/**
 * Commit empty and push to sugo-scaffold
 */

process.chdir(`${__dirname}/../..`)

const { pushOtherRepository } = require('sugos-travis')

pushOtherRepository({
  repository: 'sugo-scaffold'
})
