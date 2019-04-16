import { web3 } from '@codex-protocol/ethereum-service'

export default {
  process: {
    logLevel: 'info',
  },
  blockchain: {
    startingBlockHeight: 6000000,
    minConfirmations: web3.transactionConfirmationBlocks,
    averageBlockTime: 15, // in seconds, this dictates how frequently to run agenda jobs
    chunkSize: 50000, // max number of blocks to request each time the process-blocks job is run
  },
}
