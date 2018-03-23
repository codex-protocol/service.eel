import mongoose from 'mongoose'

const { Schema } = mongoose

const JobSchema = new Schema({
  name: String,
  data: Schema.Types.Mixed,
})

const Job = mongoose.model('Job', JobSchema)

export default Job
