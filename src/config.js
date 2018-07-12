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
      minConfirmations: 0,
      startingBlockHeight: 0,
      averageBlockTime: 15, // in seconds, this dictates how frequently to run agenda jobs
    },
  },

  staging: {
    mongodbUri: encodeURI(process.env.MONGODB_URI), // NOTE: encodeURI is necessary for passwords with URI reserved characters
    process: {
      logLevel: 'verbose',
    },
    blockchain: {
      minConfirmations: 5,
      startingBlockHeight: 3436527,
      averageBlockTime: 15, // in seconds, this dictates how frequently to run agenda jobs
    },
  },

  production: {
    mongodbUri: encodeURI(process.env.MONGODB_URI), // NOTE: encodeURI is necessary for passwords with URI reserved characters
    process: {
      logLevel: 'verbose',
    },
    blockchain: {
      minConfirmations: 5,
      startingBlockHeight: 2449841, // TODO: update this when production is pointing to mainnet (non-beta)
      averageBlockTime: 15, // in seconds, this dictates how frequently to run agenda jobs
    },
  },
}

process.env.NODE_ENV = process.env.NODE_ENV || 'development'

const envConfig = fullConfig[process.env.NODE_ENV]

envConfig.useSentry = !!process.env.SENTRY_DSN

export default envConfig
