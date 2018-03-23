import mongoose from 'mongoose'

const { Schema } = mongoose

const BlockchainEventSchema = new Schema({
  eventName: String,
  blockNumber: Number,
  contractName: String,
  contractAddress: String,
  transactionHash: String,
  returnValues: Schema.Types.Mixed,
  createdAt: {
    type: Date,
    default: () => {
      return Date.now()
    },
  },
})

const BlockchainEvent = mongoose.model('BlockchainEvent', BlockchainEventSchema)

export default BlockchainEvent
