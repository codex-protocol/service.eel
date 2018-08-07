import Bluebird from 'bluebird'
import { eth, contracts } from '@codex-protocol/ethereum-service'

import config from '../config'
import models from '../models'
import logger from '../services/logger'

export default {

  name: 'process-blocks',
  frequency: `${config.blockchain.averageBlockTime} seconds`,

  setup() {
    // this is just so we don't have to call Object.values(contracts) in each
    //  job loop
    //
    // since the contracts in @codex-protocol/ethereum-service are populated at
    //  run time and never changed, we can be confident that caching the object
    //  values is ok
    this.contracts = Object.values(contracts)
  },

  getJob() {
    return models.Job.findOne({ name: this.name })
      .then((job) => {

        if (job) {
          return job
        }

        logger.verbose(`[${this.name}] no job found, creating a new one`)

        return models.Job.create({
          name: this.name,
          data: {
            nextBlockNumberToProcess: config.blockchain.startingBlockHeight,
          },
        })

      })
  },

  execute() {

    return this.getJob()
      .then((job) => {

        return eth.getBlockNumber()
          .then((currentBlockNumber) => {

            const currentBlockNumberWithMinConfirmations = currentBlockNumber - config.blockchain.minConfirmations

            logger.verbose(`[${this.name}]`, 'current block number is', currentBlockNumber)
            logger.verbose(`[${this.name}]`, `current block number with ${config.blockchain.minConfirmations} confirmations is`, currentBlockNumberWithMinConfirmations)

            if (job.data.nextBlockNumberToProcess > currentBlockNumberWithMinConfirmations) {
              logger.verbose(`[${this.name}]`, `no blocks to process, waiting until ${job.data.nextBlockNumberToProcess} has at least ${config.blockchain.minConfirmations} confirmations`)
              return job
            }

            return this.processBlocks(job.data.nextBlockNumberToProcess, currentBlockNumberWithMinConfirmations)
              .then((nextBlockNumberToProcess) => {
                job.data.nextBlockNumberToProcess = nextBlockNumberToProcess
                job.markModified('data')
                return job.save()
              })

          })
          .catch((error) => {
            logger.info(`[${this.name}]`, 'could not get currentBlockNumber:', error)
          })

      })

  },

  processBlocks(fromBlockNumber, toBlockNumber) {

    let currentBlockNumberToProcess = fromBlockNumber

    // create an (inclusive) array of numbers in the form:
    //  [fromBlockNumber, ..., toBlockNumber]
    const blockNumbers = new Array((toBlockNumber - fromBlockNumber) + 1)
      .fill(0)
      .map((element, index) => {
        return fromBlockNumber + index
      })

    return Bluebird
      .mapSeries(blockNumbers, (blockNumber) => {
        return eth.getBlock(blockNumber, true)
          .then((block) => {

            // NOTE: mapSeries will short circuit when a promise rejects, so the
            //  following loop will stop processing this chunk of blocks if
            //  eth.getBlock() returns null for a given block number, thus
            //  leaving currentBlockNumberToProcess set to the last processed
            //  block number
            currentBlockNumberToProcess = blockNumber

            if (!block) {
              throw new Error(`eth.getBlock() returned ${block} for block number ${blockNumber} when processing block number(s) ${fromBlockNumber} through ${toBlockNumber}`)
            }

            return this.processBlock(block)

          })
          .catch((error) => {
            logger.info(`[${this.name}]`, `could not get block number ${blockNumber}:`, error)

            // @NOTE: be sure to throw the error here so the .catch() is picked
            //  up below instead of the .then() (which would cause a block to be
            //  skipped an unprocessed)
            throw error
          })
      })
      .then(() => {
        // NOTE: add 1 here since if all blocks were processed succefully, then
        //  currentBlockNumberToProcess === toBlockNumber and we want to start
        //  at the next block when this method is called again
        return currentBlockNumberToProcess + 1
      })
      .catch(() => {
        return currentBlockNumberToProcess
      })

  },

  processBlock(block) {

    logger.verbose(`[${this.name}]`, 'processing block number', block.number)

    return Bluebird.map(this.contracts, (contract) => {

      return contract.getPastEvents('allEvents', { fromBlock: block.number, toBlock: block.number })
        .then((events) => {

          return Bluebird.map(events, (event) => {

            logger.verbose(`[${this.name}]`, `found event on block number ${block.number}:`, `[${contract.name}]`, event.event)
            logger.debug(`[${this.name}]`, 'event data:', `[${contract.name}]`, event)

            // remove all the "numbered" keys in event.returnValues
            //  since we really just want their named counterparts
            const filteredReturnValues = event.returnValues

            Object.keys(filteredReturnValues).forEach((key) => {
              if (!Number.isNaN(+key)) {
                delete filteredReturnValues[key]
              }
            })

            const newBlockchainEventData = {
              eventName: event.event,
              contractName: contract.name,
              blockNumber: event.blockNumber,
              contractAddress: event.address,
              returnValues: filteredReturnValues,
              transactionHash: event.transactionHash,
            }

            const blockchainEvent = new models.BlockchainEvent(newBlockchainEventData)

            return blockchainEvent.save()

          })

        })

    })

  },

}
