import { scheduleJob, RecurrenceRule } from "node-schedule";
import {
  deleteFailedJobService,
  getAllJobsService,
} from "../service/scheduleJob.service";
import jobCallbacks from "./schedulerJobsCallbacks";
import logger from "./logger";
enum scheduledJobStatus {
  QUEUED = "queued",
  FAILED = "failed",
  COMPLETE = "complete",
}
import { Op } from "sequelize";

export default async function rescheduleJobs() {
  const jobs = await getAllJobsService({
    findOptions: {
      where: {
        status: scheduledJobStatus.QUEUED,
        scheduledTime: { [Op.gte]: new Date() },
      },
    },
  });
  if (jobs) {
    jobs.forEach((job) => {
      if (!job) {
        return;
      }
      const callback = jobCallbacks.get(job.callbackName);
      if (!callback) {
        logger.error(`can't find callback with this name: ${job.callbackName}`);
        //skip this callback
        return;
      }
      scheduleJob(job.name, job.scheduledTime, () => {
        callback({ ...job.data, jobId: job.id });
      });
    });
    logger.info("jobs rescheduled successfully!");
  }
}
export function cleanupJobsWeekly() {
  const rule = new RecurrenceRule();
  rule.dayOfWeek = 0; // runs on Sunday
  rule.hour = 0; // runs at midnight
  rule.minute = 0;
  scheduleJob("clean-outdated-session-job", rule, async function () {
    await deleteFailedJobService();
    console.log("Deleted all failed and outdated jobs");
  });
}

export function resetTeachersMonthly() {
  const rule = new RecurrenceRule();
  rule.date = 1; // runs on the 1st day of the month
  rule.hour = 0; // runs at midnight
  rule.minute = 0;
  scheduleJob("reset-teachers-monthly", rule, async function () {
    try {
      const { resetAllTeachersService } = await import("../service/teacher.service");
      await resetAllTeachersService();
      logger.info("Successfully reset all teachers' balance and committed_mins for new month");
    } catch (error: any) {
      logger.error(`Failed to reset teachers monthly: ${error.message}`);
    }
  });
}
export function getSessionReminderJobName(sessionId: number) {
  return `session #${sessionId} Reminder`;
}
export function getSessionStartedJobName(sessionId: number) {
  return `session #${sessionId} Started`;
}
export function getSessionOngoingJobName(sessionId: number) {
  return `session #${sessionId} ONGOING Updating`;
}
export function getSessionFinishedJobName(sessionId: number) {
  return `session #${sessionId} finished Updating`;
}
export function getRescheduleRequestJobName(requestId: number) {
  return `Reschedule Request #${requestId}`;
}
