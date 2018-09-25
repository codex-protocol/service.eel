export default {
  process: {
    logLevel: 'verbose',
  },
  blockchain: {
    startingBlockHeight: 3436527,
    averageBlockTime: 15, // in seconds, this dictates how frequently to run agenda jobs
    minConfirmations: 5,
    chunkSize: 50000, // max number of blocks to request each time the process-blocks job is run
  },
}
