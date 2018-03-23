import mongoose from 'mongoose'
import Bluebird from 'bluebird'

import config from '../config'

export default () => {
  mongoose.Promise = Bluebird
  return mongoose.connect(config.mongodbUri, { useMongoClient: true })
}
