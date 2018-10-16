export default {
  process: {
    logLevel: 'verbose',
  },
  blockchain: {
    startingBlockHeight: 4132900,
    averageBlockTime: 15, // in seconds, this dictates how frequently to run agenda jobs
    minConfirmations: 1,
    chunkSize: 50000, // max number of blocks to request each time the process-blocks job is run
  },
}
