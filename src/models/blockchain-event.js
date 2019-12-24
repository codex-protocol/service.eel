import mongoose from 'mongoose'

const schema = new mongoose.Schema({
  eventName: {
    index: true,
    type: String,
  },
  manuallyReprocess: {
    type: Boolean,
    default: false,
  },
  blockNumber: {
    type: Number,
    required: true,
  },
  contractName: {
    type: String,
    required: true,
  },
  contractAddress: {
    type: String,
    required: true,
  },
  transactionHash: {
    type: String,
    required: true,
  },
  returnValues: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  createdAt: {
    type: Date,
    index: true,
    default: Date.now,
  },
  error: {
    type: String,
    default: null,
  },
})

schema.index({ blockNumber: 1, contractName: 1 })
schema.index({ manuallyReprocess: 1, contractName: 1, blockNumber: 1 })

export default mongoose.model('BlockchainEvent', schema)
