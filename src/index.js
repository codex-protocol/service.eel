import 'babel-polyfill'

import Bluebird from 'bluebird'

import logger from './services/logger'
import startJobs from './initializers/jobs'
import loadContracts from './initializers/contracts'
import connectToMongoDb from './initializers/mongo'

import contracts from './services/contracts'

Bluebird.resolve()
  .then(connectToMongoDb)
  .then(loadContracts)
  .then(startJobs)
  .then(() => {
    logger.info('🐍  eel is listening for blockchain events on the following smart contract(s):', `[ ${Object.keys(contracts).join(', ')} ]`)
  })
