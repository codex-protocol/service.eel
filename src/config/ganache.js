export default {
  process: {
    logLevel: 'silly',
  },
  blockchain: {
    startingBlockHeight: 0,
    minConfirmations: 0, // @NOTE: when ganache "automine" is on locally, use 0 instead of 1 (which is required by web3.transactionConfirmationBlocks...)
    averageBlockTime: 15, // in seconds, this dictates how frequently to run agenda jobs
    chunkSize: 50000, // max number of blocks to request each time the process-blocks job is run
  },
}
