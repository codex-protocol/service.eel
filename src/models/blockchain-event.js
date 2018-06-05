import mongoose from 'mongoose'

const schema = new mongoose.Schema({
  eventName: {
    index: true,
    type: String,
  },
  blockNumber: Number,
  contractName: String,
  contractAddress: String,
  transactionHash: String,
  returnValues: mongoose.Schema.Types.Mixed,
  createdAt: {
    type: Date,
    default: () => {
      return Date.now()
    },
  },
})


export default mongoose.model('BlockchainEvent', schema)
