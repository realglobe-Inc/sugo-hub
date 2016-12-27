/**
 * Define a logger for hub
 * @function hubLogger
 * @param {string} filename - Log filename
 * @returns {Object} - A logger instance
 */
'use strict'

const { Logger, transports } = require('winston')
const path = require('path')
const mkdirp = require('mkdirp')

/** hubLogger */
function hubLogger (filename) {
  mkdirp.sync(path.dirname(filename))
  let logger = new (Logger)({
    transports: [
      new (transports.File)({
        filename,
        json: false
      })
    ]
  })
  return Object.assign(logger, {})
}

module.exports = hubLogger
