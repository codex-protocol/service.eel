export default {
  process: {
    logLevel: 'silly',
  },
  blockchain: {
    startingBlockHeight: 0,
    averageBlockTime: 15, // in seconds, this dictates how frequently to run agenda jobs
    minConfirmations: 0,
    chunkSize: 50000, // max number of blocks to request each time the process-blocks job is run
  },
}
