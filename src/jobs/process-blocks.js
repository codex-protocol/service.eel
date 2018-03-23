/* eslint-disable class-methods-use-this */

import Bluebird from 'bluebird'

import config from '../config'
import models from '../models'
import contracts from '../contracts'
import logger from '../services/logger'
import ethereumService from '../services/ethereum'

export default {

  name: 'eel.process-blocks',
  frequency: `${config.blockchain.averageBlockTime} seconds`,

  setup() {

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

        return ethereumService.getBlockNumber()
          .then((currentBlockNumber) => {

            const currentBlockNumberWithMinConfirmations = currentBlockNumber - config.blockchain.minConfirmations

            logger.verbose(`[${this.name}]`, 'current block number is', currentBlockNumber)
            logger.verbose(`[${this.name}]`, `current block number with ${config.blockchain.minConfirmations} confirmations is`, currentBlockNumberWithMinConfirmations)

            if (job.data.nextBlockNumberToProcess > currentBlockNumberWithMinConfirmations) {
              logger.verbose(`[${this.name}]`, `no blocks to process, waiting until ${job.data.nextBlockNumberToProcess} has at least ${config.blockchain.minConfirmations} confirmations`)
              return job
            }

            return this.processBlocks(job, job.data.nextBlockNumberToProcess, currentBlockNumberWithMinConfirmations)
              .then((nextBlockNumberToProcess) => {
                job.data.nextBlockNumberToProcess = nextBlockNumberToProcess
                job.markModified('data')
                return job.save()
              })

          })

      })

  },

  processBlocks(job, fromBlockNumber, toBlockNumber) {

    const getBlockPromises = []

    let nextBlockNumberToProcess = fromBlockNumber

    for (; nextBlockNumberToProcess <= toBlockNumber; nextBlockNumberToProcess++) {
      getBlockPromises.push(ethereumService.getBlock(nextBlockNumberToProcess))
    }

    return Bluebird.all(getBlockPromises)
      .then((blocks) => {
        return Bluebird.map(blocks, (block) => {
          return this.processBlock(block)
        })
      })
      .then(() => {
        return nextBlockNumberToProcess
      })

  },

  processBlock(block) {

    logger.verbose(`[${this.name}]`, 'processing block number', block.number)

    return Bluebird.map(contracts, (contract) => {

      return contract.getPastEvents('allEvents', { fromBlock: block.number, toBlock: block.number })
        .then((events) => {

          return Bluebird.map(events, (event) => {

            logger.info(`[${this.name}]`, `found event on block number ${block.number}:`, `[${contract.name}]`, event.event)
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
