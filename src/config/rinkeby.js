export default {
  process: {
    logLevel: 'info',
  },
  blockchain: {
    startingBlockHeight: 3069600,
    averageBlockTime: 15, // in seconds, this dictates how frequently to run agenda jobs
    minConfirmations: 1,
    chunkSize: 50000, // max number of blocks to request each time the process-blocks job is run
  },
}
