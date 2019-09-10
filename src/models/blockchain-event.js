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
    default: Date.now,
  },
})

schema.index({ blockNumber: 1, contractName: 1 })
schema.index({ blockNumber: 1, contractName: 1, manuallyReprocess: 1 })

export default mongoose.model('BlockchainEvent', schema)
