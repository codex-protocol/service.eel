import Agenda from 'agenda'
import Bluebird from 'bluebird'
import filewalker from 'filewalker'

import config from '../config'
import logger from '../services/logger'

const jobs = []

export default () => {

  const agenda = new Agenda({
    db: {
      address: config.mongodbUri,
      options: {
        useNewUrlParser: true,
      },
    },
  })

  const gracefulShutdown = () => {
    agenda.stop(() => {
      process.exit(0)
    })
  }

  process.on('SIGINT', gracefulShutdown)
  process.on('SIGTERM', gracefulShutdown)

  return Bluebird.resolve()

    // first, loop over the jobs directory and load all the modules...
    .then(() => {

      return new Bluebird((resolve, reject) => {

        agenda.on('ready', () => {

          const filewalkerHandler = filewalker(`${__dirname}/../jobs`, { recursive: true })

          filewalkerHandler.on('error', reject)
          filewalkerHandler.on('done', () => { resolve() })

          // dynamically load & register all the jobs
          filewalkerHandler.on('file', (jobFilePath) => {

            // do not consider files & folders that start with an underscore or
            //  dot as valid jobs (also ignore sourcemap files)
            if (/^(_|\.)/.test(jobFilePath) || /\/(_|\.)/g.test(jobFilePath) || /\.js\.map$/.test(jobFilePath)) {
              return
            }

            // eslint-disable-next-line import/no-dynamic-require, global-require
            const job = require(`${__dirname}/../jobs/${jobFilePath}`).default

            if (!job || typeof job.execute !== 'function') {
              logger.warn(`job ${jobFilePath} has no execute method defined`)
              return
            }

            jobs.push(job)

          })

          filewalkerHandler.walk()

        })
      })
    })

    // then register all the jobs with agenda...
    .then(() => {

      return Bluebird.map(jobs, (job) => {

        agenda.define(job.name, (agendaJob, done) => {
          job.execute()
            .then(() => {
              done()
            })
            .catch((error) => {
              logger.error(`[${job.name}]`, 'could not execute job:', error)
              done(error)
            })
        })

        // if no frequency is defined, the job will only be run manually
        //  and never periodically
        if (!job.frequency) {
          return null
        }

        return agenda.every(job.frequency, job.name, null, job.options)

      })

    })

    // finally, start agenda
    .then(() => {
      agenda.start()
    })

}
