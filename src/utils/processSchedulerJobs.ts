import { scheduleJob } from "node-schedule"
import { getAllJobsService } from "../service/scheduleJob.service"
import jobCallbacks from "./schedulerJobsCallbacks"
import logger from "./logger"

export default async function rescheduleJobs() {
  const jobs = await getAllJobsService({})
  jobs.forEach((job) => {
    const callback = jobCallbacks.get(job.callbackName)
    if (!callback) {
      logger.error(`can't find callback with this name: ${job.callbackName}`)
      //skip this callback
      return
    }
    scheduleJob(job.name, job.scheduledTime, () => {
      callback({ ...job.data, jobId: job.id })
    })
  })
  logger.info('jobs rescheduled successfully!')
}
export function getSessionReminderJobName(sessionId: number) {
  return `session #${sessionId} Reminder`
}
export function getSessionStartedJobName(sessionId: number) {
  return `session #${sessionId} Started`
}
export function getSessionOngoingJobName(sessionId: number) {
  return `session #${sessionId} ONGOING Updating`
}
export function getSessionFinishedJobName(sessionId: number) {
  return `session #${sessionId} finished Updating`
}
export function getRescheduleRequestJobName(requestId: number) {
  return `Reschedule Request #${requestId}`
}
