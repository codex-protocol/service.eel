import { web3 } from '@codex-protocol/ethereum-service'

export default {
  process: {
    logLevel: 'info',
  },
  blockchain: {
    startingBlockHeight: 3069600,
    minConfirmations: web3.transactionConfirmationBlocks,
    averageBlockTime: 60, // in seconds, this dictates how frequently to run agenda jobs
    chunkSize: 50000, // max number of blocks to request each time the process-blocks job is run
  },
}
