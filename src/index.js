import 'babel-polyfill'

import Bluebird from 'bluebird'

import logger from './services/logger'
import startJobs from './initializers/jobs'
import connectToMongoDb from './initializers/mongo'

Bluebird.resolve()
  .then(connectToMongoDb)
  .then(startJobs)
  .then(() => {
    logger.verbose('🐍  eel is listening for blockchain events')
  })
