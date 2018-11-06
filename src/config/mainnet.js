export default {
  process: {
    logLevel: 'info',
  },
  blockchain: {
    startingBlockHeight: 6000000,
    averageBlockTime: 15, // in seconds, this dictates how frequently to run agenda jobs
    minConfirmations: 2,
    chunkSize: 50000, // max number of blocks to request each time the process-blocks job is run
  },
}
