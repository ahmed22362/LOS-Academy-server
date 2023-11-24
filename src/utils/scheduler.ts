import schedule from "node-schedule"
import Mail from "../connect/sendMail"
import logger from "./logger"
import { getOneSessionDetailsService } from "../service/session.service"
import { getOneRescheduleRequestService } from "../service/rescheduleReq.service"
import { RoleType } from "../db/models/teacher.model"
import { createJobService } from "../service/scheduleJob.service"
import jobCallbacks, { callbacksNames } from "./schedulerJobsCallbacks"
import AppError from "./AppError"
import {
  getSessionFinishedJobName,
  getSessionOngoingJobName,
  getSessionReminderJobName,
  getSessionStartedJobName,
} from "./processSchedulerJobs"
import { log } from "console"
import ScheduleJob from "../db/models/scheduleJob.model"
import { Transaction } from "sequelize"

const MS_IN_MINUTE = 1000 * 60

export function scheduleVerifyMailJob({
  to,
  name,
  link,
}: {
  to: string
  name: string
  link: string
}) {
  try {
    const mail = new Mail(to, name)

    logger.info("in send verify mail schedule!")
    const date = new Date(new Date().getTime() + 1000)
    schedule.scheduleJob(date, async () => {
      await mail.sendVerifyMail({ link })
      logger.info("One time send verify mail executed!")
    })
  } catch (error: any) {
    logger.error(`Error while send verify mail: ${error.message}`)
  }
}
export function scheduleSuccessSubscriptionMailJob({
  to,
  name,
  subscriptionAmount,
  subscriptionCycle,
  subscriptionTitle,
}: {
  to: string
  name: string
  subscriptionTitle: string
  subscriptionAmount: number
  subscriptionCycle: string
}) {
  try {
    const mail = new Mail(to, name)
    logger.info("in send subscription success mail schedule!")
    const date = new Date(new Date().getTime() + 1000)
    schedule.scheduleJob(date, async () => {
      await mail.sendSubscriptionCreateMail({
        subscriptionAmount,
        subscriptionCycle,
        subscriptionTitle,
      })
      logger.info("One time send subscription success mail executed!")
    })
  } catch (error: any) {
    logger.error(`Error while subscription success mail: ${error.message}`)
  }
}
export function scheduleSubscriptionCanceledMailJob({
  to,
  name,
}: {
  to: string
  name: string
}) {
  try {
    const mail = new Mail(to, name)
    logger.info("in send subscription cancelled mail schedule!")
    const date = new Date(new Date().getTime() + 1000)
    schedule.scheduleJob(date, async () => {
      await mail.sendSubscriptionCanceledMail()
      logger.info("One time send subscription cancelled executed!")
    })
  } catch (error: any) {
    logger.error(`Error while subscription cancelled mail: ${error.message}`)
  }
}
export function scheduleSessionPlacedMailJob({
  userEmail,
  userName,
  teacherEmail,
  teacherName,
  sessionDate,
}: {
  userEmail: string
  userName: string
  teacherEmail: string
  teacherName: string
  sessionDate: Date
}) {
  try {
    logger.info("in send session placed mail schedule!")
    const date = new Date(new Date().getTime() + 1000)
    schedule.scheduleJob(`Session`, date, async () => {
      await new Mail(userEmail, userName).sendSessionPlacesMail({
        sessionDate: sessionDate.toUTCString(),
      })
      await new Mail(teacherEmail, teacherName).sendSessionPlacesMail({
        sessionDate: sessionDate.toUTCString(),
      })
      logger.info("One time session placed mail executed!")
    })
  } catch (error: any) {
    logger.error(`Error while session placed mail: ${error.message}`)
  }
}
export function scheduleSessionRescheduleRequestMailJob({
  sessionId,
  sessionOldDate,
  newDatesOptions,
  requestedBy,
}: {
  sessionId: number
  sessionOldDate: Date
  newDatesOptions: Date[]
  requestedBy: RoleType
}) {
  try {
    logger.info("in session reschedule request mail schedule!")
    const date = new Date(new Date().getTime() + 1000)
    let email: string, name: string, receiverName: string
    const job = schedule.scheduleJob(
      `Session #${sessionId}`,
      date,
      async () => {
        const session = await getOneSessionDetailsService({ sessionId })
        if (requestedBy === RoleType.USER) {
          email = session.SessionInfo.teacher!.email
          name = session.SessionInfo.teacher!.name
          receiverName = session.SessionInfo.user!.name
        }
        if (requestedBy === RoleType.TEACHER) {
          email = session.SessionInfo.user!.email
          name = session.SessionInfo.user!.name
          receiverName = session.SessionInfo.teacher!.name
        }
        await new Mail(email, name).sendSessionRescheduleRequestMail({
          receiverName,
          sessionOldDate,
          newDatesOptions,
        })
        logger.info("One time session reschedule request mail executed!")
      }
    )
  } catch (error: any) {
    logger.error(
      `Error while session reschedule request mail: ${error.message}`
    )
  }
}
export function scheduleSessionRescheduleRequestUpdateMailJob({
  rescheduleRequestId,
  status,
  requestedBy,
}: {
  rescheduleRequestId: number

  status: string
  requestedBy: RoleType
}) {
  try {
    logger.info("in session reschedule request status update mail schedule!")
    const date = new Date(new Date().getTime() + 1000)
    let email: string, name: string, senderName: string
    const job = schedule.scheduleJob(
      `Reschedule Request ${rescheduleRequestId}`,
      date,
      async () => {
        const rescheduleRequest = await getOneRescheduleRequestService({
          id: rescheduleRequestId,
        })
        const session = await getOneSessionDetailsService({
          sessionId: rescheduleRequest.sessionId,
        })
        if (requestedBy === RoleType.TEACHER) {
          email = session.SessionInfo.user!.email
          name = session.SessionInfo.user!.name
          senderName = session.SessionInfo.teacher!.name
        }
        if (requestedBy === RoleType.USER) {
          email = session.SessionInfo.teacher!.email
          name = session.SessionInfo.teacher!.name
          senderName = session.SessionInfo.user!.name
        }
        await new Mail(email, name).sendSessionRescheduleRequestUpdateMail({
          status,
          senderName,
          sessionOldDate: session.sessionDate,
          newDatesOptions: rescheduleRequest.newDatesOptions,
          sessionNewDate: session.sessionDate,
        })
        logger.info("One time session reminder mail executed!")
      }
    )
  } catch (error: any) {
    logger.error(
      `Error while session reschedule request status update mail: ${error.message}`
    )
  }
}
export function schedulePayoutRequestMailJob({
  teacherName,
  amount,
}: {
  teacherName: string
  amount: number
}) {
  try {
    logger.info("in payout request mail schedule!")
    const date = new Date(new Date().getTime() + 1000)

    const job = schedule.scheduleJob(date, async () => {
      await new Mail(
        process.env.ADMIN_EMAIL as string,
        "admin"
      ).sendPayoutRequestMail({ teacherName, amount })
      logger.info("One time payout request mail executed!")
    })
  } catch (error: any) {
    logger.error(`Error while payout request mail: ${error.message}`)
  }
}
export function schedulePayoutStatusUpdateMailJob({
  teacherName,
  teacherEmail,
  status,
}: {
  teacherEmail: string
  teacherName: string
  status: string
}) {
  try {
    logger.info("in payout status updated mail schedule!")
    const date = new Date(new Date().getTime() + 1000)

    const job = schedule.scheduleJob(date, async () => {
      await new Mail(
        teacherEmail,
        teacherName
      ).sendPayoutRequestStatusUpdatedMail({
        status,
      })
      logger.info("One payout status updated mail executed!")
    })
  } catch (error: any) {
    logger.error(`Error while payout status updated mail: ${error.message}`)
  }
}
// here if there is no response from both side update it to be no response
export function scheduleUpdateSessionRescheduleRequestStatus({
  rescheduleRequestId,
}: {
  rescheduleRequestId: number
}) {}

export async function rescheduleSessionJobs({
  sessionId,
  newDate,
  sessionDuration,
  transaction,
}: {
  sessionId: number
  newDate: Date
  sessionDuration: number
  transaction?: Transaction
}) {
  const jobReminderName = getSessionReminderJobName(sessionId)
  const jobStartedName = getSessionStartedJobName(sessionId)
  const jobOngoingName = getSessionOngoingJobName(sessionId)
  const jobFinishedName = getSessionFinishedJobName(sessionId)
  const ThirtyMinInMS = 30 * MS_IN_MINUTE
  const ThreeMinInMS = 4 * MS_IN_MINUTE
  const jobs = schedule.scheduledJobs
  const reminderJob = jobs[jobReminderName]
  const sessionStartedJob = jobs[jobStartedName]
  const sessionOngoingJob = jobs[jobOngoingName]
  const sessionFinishedJob = jobs[jobFinishedName]
  const reminderNewDate = new Date(newDate.getTime() - ThirtyMinInMS)
  const startedNewDate = new Date(newDate.getTime() + ThreeMinInMS)
  const ongoingNewDate = new Date(newDate.getTime() - MS_IN_MINUTE)
  const finishedNewDate = new Date(
    newDate.getTime() + sessionDuration * MS_IN_MINUTE
  )
  try {
    if (reminderJob) {
      reminderJob.reschedule(reminderNewDate.getTime())
        ? logger.info("reschedule reminderJob success")
        : logger.error("reschedule reminderJob fail")
      await ScheduleJob.update(
        { scheduledTime: startedNewDate },
        { where: { name: jobReminderName }, transaction }
      )
    }
    if (sessionStartedJob) {
      sessionStartedJob.reschedule(startedNewDate.getTime())
        ? logger.info("reschedule sessionStartedJob success")
        : logger.error("reschedule sessionStartedJob fail")
      await ScheduleJob.update(
        { scheduledTime: startedNewDate },
        { where: { name: jobStartedName }, transaction }
      )
    }
    if (sessionOngoingJob) {
      sessionOngoingJob.reschedule(ongoingNewDate.getTime())
        ? logger.info("reschedule sessionOngoingJob success")
        : logger.error("reschedule sessionOngoingJob fail")
      await ScheduleJob.update(
        { scheduledTime: ongoingNewDate },
        { where: { name: jobOngoingName }, transaction }
      )
    }
    if (sessionFinishedJob) {
      sessionFinishedJob.reschedule(finishedNewDate.getTime())
        ? logger.info("reschedule sessionFinishedJob success")
        : logger.error("reschedule sessionFinishedJob fail")
      await ScheduleJob.update(
        { scheduledTime: finishedNewDate },
        { where: { name: jobFinishedName }, transaction }
      )
    }
  } catch (error: any) {
    throw new AppError(400, `Error While rescheduling: ${error.message}`)
  }
}
export async function scheduleSessionReminderMailJob({
  sessionDate,
  sessionId,
  studentName,
  studentEmail,
  teacherName,
  teacherEmail,
}: {
  sessionDate: Date
  sessionId: number
  studentName: string
  studentEmail: string
  teacherName: string
  teacherEmail: string
}) {
  try {
    logger.info("in session reminder mail schedule!")
    const ThirtyMinInMS = 30 * MS_IN_MINUTE
    const date = new Date(sessionDate.getTime() - ThirtyMinInMS)
    const jobName = getSessionReminderJobName(sessionId)
    const callbackName = callbacksNames.SESSION_REMINDER_MAIL
    const dbJob = await createJobService({
      body: {
        name: jobName,
        scheduledTime: date,
        callbackName,
        data: {
          sessionDate,
          studentName,
          studentEmail,
          teacherName,
          teacherEmail,
        },
      },
    })
    const sessionReminderCallback = jobCallbacks.get(callbackName)
    if (!sessionReminderCallback) {
      throw new AppError(
        404,
        `Can't find callback with this name ${callbackName}`
      )
    }
    schedule.scheduleJob(jobName, date, async () => {
      await sessionReminderCallback({
        sessionDate,
        studentName,
        studentEmail,
        teacherName,
        teacherEmail,
        jobId: dbJob.id,
      })
    })
  } catch (error: any) {
    logger.error(`Error while session reminder mail: ${error.message}`)
  }
}
export async function scheduleSessionStartReminderMailJob({
  sessionId,
  sessionDate,
}: {
  sessionId: number
  sessionDate: Date
}) {
  try {
    logger.info("in session started mail schedule!")
    // add 4 mins to the session start to check if the user attend
    const ThreeMinInMS = 3 * MS_IN_MINUTE
    const date = new Date(sessionDate.getTime() + ThreeMinInMS)
    const jobName = getSessionStartedJobName(sessionId)
    const callbackName = callbacksNames.SESSION_STARTED_MAIL
    const dbJob = await createJobService({
      body: {
        name: jobName,
        scheduledTime: new Date(date),
        callbackName,
        data: { sessionId },
      },
    })
    const sessionStartedCallback = jobCallbacks.get(callbackName)
    if (!sessionStartedCallback) {
      throw new AppError(
        404,
        `Can't find callback with this name ${callbackName}`
      )
    }
    const job = schedule.scheduleJob(jobName, date, async () => {
      await sessionStartedCallback({ sessionId, jobId: dbJob.id })
    })
  } catch (error: any) {
    logger.error(`Error while session started reminder mail: ${error.message}`)
  }
}
export async function scheduleUpdateSessionToOngoing({
  sessionId,
  sessionDate,
}: {
  sessionId: number
  sessionDate: Date
}) {
  try {
    logger.info("in update session to ongoing schedule!")
    const jobName = getSessionOngoingJobName(sessionId)
    const callbackName = callbacksNames.UPDATE_SESSION_TO_ONGOING
    const dbJob = await createJobService({
      body: {
        name: jobName,
        scheduledTime: new Date(sessionDate.getTime() - MS_IN_MINUTE),
        callbackName,
        data: {
          sessionId,
        },
      },
    })
    const sessionUpdateCallback = jobCallbacks.get(callbackName)
    if (!sessionUpdateCallback) {
      throw new AppError(
        404,
        `Can't find callback with this name ${callbackName}`
      )
    }
    schedule.scheduleJob(jobName, sessionDate, async () => {
      await sessionUpdateCallback({
        sessionId,
        jobId: dbJob.id,
      })
    })
  } catch (error: any) {
    logger.error(`Error while session ongoing mail: ${error.message}`)
  }
}
export async function scheduleUpdateSessionToFinished({
  sessionId,
  sessionDate,
  sessionDuration,
}: {
  sessionId: number
  sessionDate: Date
  sessionDuration: number
}) {
  try {
    logger.info("in update session to finished schedule!")
    const jobName = getSessionFinishedJobName(sessionId)
    const callbackName = callbacksNames.UPDATE_SESSION_TO_FINISHED
    const date = sessionDate.getTime() + sessionDuration * MS_IN_MINUTE
    const dbJob = await createJobService({
      body: {
        name: jobName,
        scheduledTime: new Date(date),
        callbackName,
        data: {
          sessionId,
        },
      },
    })
    const sessionUpdateCallback = jobCallbacks.get(callbackName)
    if (!sessionUpdateCallback) {
      throw new AppError(
        404,
        `Can't find callback with this name ${callbackName}`
      )
    }
    schedule.scheduleJob(jobName, new Date(date), async () => {
      await sessionUpdateCallback({
        sessionId,
        jobId: dbJob.id,
      })
    })
  } catch (error: any) {
    logger.error(`Error while session finished mail: ${error.message}`)
  }
}
