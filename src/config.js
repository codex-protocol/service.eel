import dotenv from 'dotenv'

// Reads environment variables stored in the '.env' file and writes them to the
//  process.env object
const result = dotenv.config({ path: `${__dirname}/../.env` })

if (result.error) {
  throw result.error
}

const fullConfig = {
  development: {
    mongodbUri: encodeURI(process.env.MONGODB_URI), // NOTE: encodeURI is necessary for passwords with URI reserved characters
    process: {
      logLevel: 'silly',
    },
    blockchain: {
      startingBlockHeight: 0,
      averageBlockTime: 15, // in seconds, this dictates how frequently to run agenda jobs
      minConfirmations: 0,
      chunkSize: 50000, // max number of blocks to request each time the process-blocks job is run
    },
  },

  staging: {
    mongodbUri: encodeURI(process.env.MONGODB_URI), // NOTE: encodeURI is necessary for passwords with URI reserved characters
    process: {
      logLevel: 'verbose',
    },
    blockchain: {
      startingBlockHeight: 3436527,
      averageBlockTime: 15, // in seconds, this dictates how frequently to run agenda jobs
      minConfirmations: 5,
      chunkSize: 50000, // max number of blocks to request each time the process-blocks job is run
    },
  },

  production: {
    mongodbUri: encodeURI(process.env.MONGODB_URI), // NOTE: encodeURI is necessary for passwords with URI reserved characters
    process: {
      logLevel: 'info',
    },
    blockchain: {
      startingBlockHeight: 6000000,
      averageBlockTime: 15, // in seconds, this dictates how frequently to run agenda jobs
      minConfirmations: 8,
      chunkSize: 50000, // max number of blocks to request each time the process-blocks job is run
    },
  },
}

process.env.NODE_ENV = process.env.NODE_ENV || 'development'

const envConfig = fullConfig[process.env.NODE_ENV]

envConfig.useSentry = !!process.env.SENTRY_DSN

export default envConfig
