import dotenv from 'dotenv'

// Reads environment variables stored in the '.env' file and writes them to the
//  process.env object
const result = dotenv.config({ path: `${__dirname}/../.env` })

if (result.error) {
  throw result.error
}

const config = {
  development: {
    mongodbUri: (process.env.MONGO_USER && process.env.MONGO_PW) ? `mongodb://${process.env.MONGO_USER}:${encodeURIComponent(process.env.MONGO_PW)}@localhost:27017/eel` : 'mongodb://localhost:27017/eel',
    process: {
      logLevel: 'silly',
    },
    blockchain: {
      minConfirmations: 0,
      startingBlockHeight: 0,
      networkId: '5777', // Ganache
      providerRpcUrl: process.env.RPC_URL,
      averageBlockTime: 15, // in seconds, this dictates how frequently to run agenda jobs
    },
  },

  staging: {
    mongodbUri: `mongodb://${process.env.MONGO_USER}:${encodeURIComponent(process.env.MONGO_PW)}@ds235239.mlab.com:35239/staging-eel`,
    process: {
      logLevel: 'verbose',
    },
    blockchain: {
      minConfirmations: 5,
      startingBlockHeight: 2053830,
      networkId: '4', // Rinkeby
      providerRpcUrl: process.env.RPC_URL,
      averageBlockTime: 15, // in seconds, this dictates how frequently to run agenda jobs
    },
  },

  // TODO: populate when a production environment is set up
  // TODO: logLevel: 'info',
  production: {},
}

process.env.NODE_ENV = process.env.NODE_ENV || 'development'

export default config[process.env.NODE_ENV]
