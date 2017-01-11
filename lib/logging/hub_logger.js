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

/** @lends hubLogger */
function hubLogger (filename) {
  let { fileLogger, consoleLogger } = hubLogger
  let logger = filename ? fileLogger(filename) : consoleLogger()
  return Object.assign(logger, {})
}

Object.assign(hubLogger, {
  consoleLogger () {
    return new Logger({
      transports: [
        new (transports.Console)({})
      ]
    })
  },
  fileLogger (filename) {
    mkdirp.sync(path.dirname(filename))
    return new Logger({
      transports: [
        new (transports.File)({
          filename,
          json: false
        })
      ]
    })
  }
})

module.exports = hubLogger
