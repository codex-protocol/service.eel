import mongoose from 'mongoose'
import Bluebird from 'bluebird'

import config from '../config'
import logger from '../services/logger'

export default () => {

  mongoose.Promise = Bluebird
  mongoose.set('debug', false)

  return mongoose.connect(config.mongodbUri, { useMongoClient: true })
    .catch((error) => {
      logger.error('could not connect to database, please make sure mongodb is running', error)
    })
}
