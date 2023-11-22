import { scheduleJob } from "node-schedule"
import { getAllJobsService } from "../service/scheduleJob.service"
import jobCallbacks from "./schedulerJobsCallbacks"
import AppError from "./AppError"

export default async function rescheduleJobs() {
  const jobs = await getAllJobsService({})
  jobs.forEach((job) => {
    const callback = jobCallbacks.get(job.callbackName)
    if (!callback) {
      throw new AppError(
        404,
        `can't find callback with this name: ${job.callbackName}`
      )
    }
    scheduleJob(job.name, job.scheduledTime, () => {
      callback({ ...job.data, jobId: job.id })
    })
  })
}
