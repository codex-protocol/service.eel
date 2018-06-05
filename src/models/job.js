import mongoose from 'mongoose'

const schema = new mongoose.Schema({
  name: {
    index: true,
    type: String,
  },
  data: mongoose.Schema.Types.Mixed,
})

export default mongoose.model('Job', schema)
