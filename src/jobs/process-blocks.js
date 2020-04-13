import Bluebird from 'bluebird'
import { eth, contracts } from '@codex-protocol/ethereum-service'

import config from '../config'
import models from '../models'
import logger from '../services/logger'

const insertManyOptions = {
  ordered: false, // insert all documents possible and report errors later
}

// this is just so we don't have to call Object.values(contracts) in each job
//  loop
//
// since the contracts in @codex-protocol/ethereum-service are populated at run
//  time and never changed, we can be confident that caching the object values
//  is ok
const cachedContracts = Object.values(contracts)
  // also filter out any contracts that haven't been deployed
  .filter((contract) => {
    return !!contract.address
  })

export default {

  name: 'process-blocks',
  frequency: `${config.blockchain.averageBlockTime} seconds`,

  getJob() {
    return models.Job.findOne({ name: this.name })
      .then((job) => {

        if (job) {
          return job
        }

        logger.verbose(`[${this.name}] no job found, creating a new one`)

        return eth.getBlockNumber()
          .then((currentBlockNumber) => {
            return currentBlockNumber - config.blockchain.minConfirmations
          })
          .then((currentBlockNumberWithMinConfirmations) => {

            const numBlocks = (currentBlockNumberWithMinConfirmations - config.blockchain.startingBlockHeight)
            const timeEstimate = Math.round((numBlocks / config.blockchain.chunkSize) * config.blockchain.averageBlockTime)
            logger.info(`[${this.name}] rebuilding database from block ${config.blockchain.startingBlockHeight} to block ${currentBlockNumberWithMinConfirmations} (${numBlocks} total blocks)`)
            logger.info(`[${this.name}] this will take about ${Math.floor(timeEstimate / 60)} minutes, ${timeEstimate % 60} seconds`)

            return models.Job.create({
              name: this.name,
              data: {
                blockNumberToManuallyReprocess: null,
                nextBlockNumberToProcess: config.blockchain.startingBlockHeight,
              },
            })
          })
      })
  },

  execute() {

    return this.getJob()
      .then((job) => {

        return eth.getBlockNumber()
          .then((currentBlockNumber) => {
            return currentBlockNumber - config.blockchain.minConfirmations
          })

          // this block deletes any existing BlockchainEvent records that have a
          //  blockNumber >= job.data.nextBlockNumberToProcess, this ensures
          //  we don't create duplicate BlockchainEvent records when the job is
          //  rebuilding the database (e.g. "catching up" to the current block
          //  after job.data.nextBlockNumberToProcess has been manually reset to
          //  an earlier block, or the job has been removed to rebuild the
          //  database entirely)
          .then((currentBlockNumberWithMinConfirmations) => {

            // if we're about to process the current block, there's no need to
            //  run the remove() since there can't possibly be any events
            //  already indexed for this block (unless, I suppose,
            //  minConfirmations changes to a smaller number in the config 🤔)
            if (job.data.nextBlockNumberToProcess >= currentBlockNumberWithMinConfirmations) {
              return currentBlockNumberWithMinConfirmations
            }

            return models.BlockchainEvent
              .deleteMany({ blockNumber: { $gte: job.data.nextBlockNumberToProcess } })
              .then((result) => {
                if (result.n > 0) {
                  logger.warn(`[${this.name}] removed ${result.n} existing BlockchainEvent records with blockNumber >= ${job.data.nextBlockNumberToProcess}`)
                }
                return currentBlockNumberWithMinConfirmations
              })

          })

          .then((currentBlockNumberWithMinConfirmations) => {

            logger.verbose(`[${this.name}]`, `current block number with ${config.blockchain.minConfirmations} confirmations is`, currentBlockNumberWithMinConfirmations)

            if (job.data.nextBlockNumberToProcess > currentBlockNumberWithMinConfirmations) {
              logger.verbose(`[${this.name}] no blocks to process, waiting until ${job.data.nextBlockNumberToProcess} has at least ${config.blockchain.minConfirmations} confirmations`)
              return job
            }

            // only get "chunkSize" blocks at a time, to prevent the job from
            //  trying to do too much and crashing the process when rebuilding
            //  the database from scratch
            const fromBlock = job.data.nextBlockNumberToProcess
            const toBlock = ((fromBlock + config.blockchain.chunkSize) - 1 > currentBlockNumberWithMinConfirmations)
              ? currentBlockNumberWithMinConfirmations
              : (fromBlock + config.blockchain.chunkSize) - 1

            return this.processBlocks(fromBlock, toBlock)
              .then(() => {
                job.data.nextBlockNumberToProcess = toBlock + 1
                job.markModified('data')
              })

          })

          .catch((error) => {
            logger.warn(`[${this.name}] could not process blocks:`, error)
          })

          .then(() => {

            if (!job.data.blockNumberToManuallyReprocess) {
              return job
            }

            logger.info(`[${this.name}] manually reprocessing block number ${job.data.blockNumberToManuallyReprocess}`)

            return this.processBlocks(job.data.blockNumberToManuallyReprocess, job.data.blockNumberToManuallyReprocess, true)
              .catch((error) => {
                logger.warn(`[${this.name}] could not manually reprocess block number ${job.data.blockNumberToManuallyReprocess}:`, error)
              })
              .finally(() => {
                job.data.blockNumberToManuallyReprocess = null
                job.markModified('data')
              })

          })

          .finally(() => {
            return job.save()
          })

      })

  },

  processBlocks(fromBlock, toBlock = fromBlock, manuallyReprocess = false) {

    if (fromBlock === toBlock) {
      logger.verbose(`[${this.name}] processing block number ${fromBlock}`)
    } else {
      logger.verbose(`[${this.name}] processing block numbers ${fromBlock} - ${toBlock}`)
    }

    // for all contracts...
    return Bluebird.mapSeries(cachedContracts, (contract) => {

      // ...get all events emitted in this chunk
      return contract
        .getPastEvents('allEvents', { fromBlock, toBlock })

        // create & return a newBlockchainEventData object for each event to
        //  be inserted in bulk later
        .then((events) => {

          return events
            .map((event) => {

              // usually this means it was deployed on that block
              if (!event.event) {
                return null
              }

              logger.verbose(`[${this.name}] found event on block number ${event.blockNumber}: [${contract.name}] ${event.event}`)
              logger.debug(`[${this.name}] event data: [${contract.name}]`, event)

              // remove all the "numbered" keys in event.returnValues since we
              //  really just want their named counterparts
              const filteredReturnValues = event.returnValues

              Object.entries(filteredReturnValues).forEach(([key, value]) => {

                if (!Number.isNaN(+key)) {
                  delete filteredReturnValues[key]
                  return
                }

                // @NOTE: web3.js 1.0.0-beta.51 introduced a REALLY ANNOYING
                //  breaking change that causes all numbers to be returned as
                //  BN.js instances instead of strings... so we have to "undo"
                //  that here...
                //
                // unfortunately the clusterfuck that is BigNumber / BN in web3
                //  makes this super hard right now, all the docs are wrong and
                //  reference non-existent features so this is a bit hacky
                //
                // see: https://github.com/ethereum/web3.js/issues/2603
                if (typeof value === 'object' && !Array.isArray(value)) {
                  if (!value._hex) {
                    logger.warn(`[${this.name}] object without _hex property found in returnValue for event (was ethers.js updated??): [${contract.name}]`, event)
                  }
                  filteredReturnValues[key] = value.toString()
                }

              })

              return {
                manuallyReprocess,
                eventName: event.event,
                contractName: contract.name,
                blockNumber: event.blockNumber,
                contractAddress: event.address,
                returnValues: filteredReturnValues,
                transactionHash: event.transactionHash,
              }

            })

            // filter out any events that had no eventName
            .filter((newBlockchainEventData) => {
              return newBlockchainEventData !== null
            })

        })

        // flatten & sort the array of arrays returned above, e.g.
        //  [[Contract1Events], [Contract2Events]] =>
        //  [Contract1Event1, Contract1Event2, Contract2Event1, Contract2Event2]
        .then((newBlockchainEventsData) => {
          return newBlockchainEventsData
            .reduce((accumulator, currentValue) => {
              return accumulator.concat(currentValue)
            }, [])
            .sort((a, b) => {
              return a.blockNumber - b.blockNumber
            })
        })

        // insert all the records
        .then((newBlockchainEventsData) => {
          return models.BlockchainEvent.insertMany(newBlockchainEventsData, insertManyOptions)
        })

    })

  },

}
