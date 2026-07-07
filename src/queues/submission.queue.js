import { Queue } from 'bullmq'
import redisConnection from '../lib/redis.js'

export const submissionQueue = new Queue('submissions', {
  connection: redisConnection,
})

export async function addSubmissionJob(jobData) {
  return await submissionQueue.add('judge-submission', jobData, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  })
}
