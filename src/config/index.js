import dotenv from 'dotenv'

process.env.NODE_ENV = process.env.NODE_ENV || 'development'

// reads environment variables stored in the '.env' file and writes them to the
//  process.env object
const dotenvResult = dotenv.config({ path: `${__dirname}/../../.env` })

if (dotenvResult.error) {
  throw dotenvResult.error
}

const commonConfig = {
  mongodbUri: encodeURI(process.env.MONGODB_URI), // NOTE: encodeURI is necessary for passwords with URI reserved characters

  // report errors to sentry if a DSN is specified
  useSentry: !!process.env.SENTRY_DSN,
}

const networkName = (() => {
  switch (process.env.ETHEREUM_NETWORK_ID) {
    case '1': return 'mainnet'
    case '3': return 'ropsten'
    case '4': return 'rinkeby'
    case '5777': return 'ganache'
    default: throw new Error(`network with id ${process.env.ETHEREUM_NETWORK_ID} is invalid, no network name defined in config`)
  }
})()

// eslint-disable-next-line import/no-dynamic-require, global-require
const networkConfig = require(`${__dirname}/${networkName}`).default

export default Object.assign({ networkName }, networkConfig, commonConfig)
