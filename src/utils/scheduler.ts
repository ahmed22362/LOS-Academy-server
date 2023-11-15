import schedule from "node-schedule"
import Mail from "../connect/sendMail"
import { getUserByIdService } from "../service/user.service"
import { getTeacherByIdService } from "../service/teacher.service"
import logger from "./logger"
import { getOneSessionDetailsService } from "../service/session.service"
import { getOneRescheduleRequestService } from "../service/rescheduleReq.service"
import { RoleType } from "../db/models/teacher.model"

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
    const date = new Date(new Date().getTime() + 10000)
    const job = schedule.scheduleJob(date, async () => {
      await mail.sendVerifyMail({ link })
      logger.info("One time send verify mail executed!")
      // Delete job
      job.cancel()
      logger.info("Job deleted")
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
    const date = new Date(new Date().getTime() + 10000)
    const job = schedule.scheduleJob(date, async () => {
      await mail.sendSubscriptionCreateMail({
        subscriptionAmount,
        subscriptionCycle,
        subscriptionTitle,
      })
      logger.info("One time send subscription success mail executed!")
      // Delete job
      job.cancel()
      logger.info("Job deleted")
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
    const date = new Date(new Date().getTime() + 10000)
    const job = schedule.scheduleJob(date, async () => {
      await mail.sendSubscriptionCanceledMail()
      logger.info("One time send subscription cancelled executed!")
      // Delete job
      job.cancel()
      logger.info("Job deleted")
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
    const date = new Date(new Date().getTime() + 10000)
    const job = schedule.scheduleJob(`Session`, date, async () => {
      await new Mail(userEmail, userName).sendSessionPlacesMail({
        sessionDate: sessionDate.toUTCString(),
      })
      await new Mail(teacherEmail, teacherName).sendSessionPlacesMail({
        sessionDate: sessionDate.toUTCString(),
      })
      logger.info("One time session placed mail executed!")
      // Delete job
      job.cancel()
      logger.info("Job deleted")
    })
  } catch (error: any) {
    logger.error(`Error while session placed mail: ${error.message}`)
  }
}
export function scheduleSessionReminderMailJob({
  sessionDate,
  sessionId,
}: {
  sessionDate: Date
  sessionId: number
}) {
  try {
    logger.info("in session reminder mail schedule!")
    const date = new Date(sessionDate).setMinutes(sessionDate.getMinutes() - 30)
    const job = schedule.scheduleJob(
      `session #${sessionId}`,
      date,
      async () => {
        const session = await getOneSessionDetailsService({ sessionId })
        await new Mail(
          session.SessionInfo.user!.email,
          session.SessionInfo.user!.name
        ).sendSessionReminderMail({
          sessionDate: sessionDate.toUTCString(),
        })
        await new Mail(
          session.SessionInfo.teacher!.email,
          session.SessionInfo.teacher!.name
        ).sendSessionReminderMail({
          sessionDate: sessionDate.toUTCString(),
        })
        logger.info("One time session reminder mail executed!")
        // Delete job
        job.cancel()
        logger.info("Job deleted")
      }
    )
  } catch (error: any) {
    logger.error(`Error while session reminder mail: ${error.message}`)
  }
}
export function scheduleSessionStartReminderMailJob({
  sessionId,
  sessionDate,
}: {
  sessionId: number
  sessionDate: Date
}) {
  try {
    logger.info("in session started mail schedule!")
    // add 4 mins to the session start to check if the user attend
    const date = new Date(sessionDate).setMinutes(sessionDate.getMinutes() + 4)

    const job = schedule.scheduleJob(
      `session #${sessionId} started`,
      date,
      async () => {
        const session = await getOneSessionDetailsService({ sessionId })
        if (!session.studentAttended) {
          await new Mail(
            session.SessionInfo.user!.email,
            session.SessionInfo.user!.name
          ).sendSessionStartReminderForUser({
            sessionDate: session.sessionDate.toUTCString(),
          })
          await new Mail(
            process.env.ADMIN_EMAIL as string,
            "Admin"
          ).sendSessionStartReminderForAdmin({
            userName: session.SessionInfo.user!.name,
            teacherName: session.SessionInfo.teacher!.name,
            sessionDate: session.sessionDate.toUTCString(),
          })
        }
        logger.info("One time session started reminder mail executed!")
        // Delete job
        job.cancel()
        logger.info("Job deleted")
      }
    )
  } catch (error: any) {
    logger.error(`Error while session started reminder mail: ${error.message}`)
  }
}
export function scheduleSessionRescheduleRequestMailJob({
  sessionId,
  sessionOldDate,
  newDateStartRange,
  newDateEndRange,
  requestedBy,
}: {
  sessionId: number
  sessionOldDate: Date
  newDateStartRange: Date
  newDateEndRange: Date
  requestedBy: RoleType
}) {
  try {
    logger.info("in session reschedule request mail schedule!")
    const date = new Date(new Date().getTime() + 10000)
    let email: string, name: string
    const job = schedule.scheduleJob(
      `Session #${sessionId}`,
      date,
      async () => {
        const session = await getOneSessionDetailsService({ sessionId })
        if (requestedBy === RoleType.USER) {
          email = session.SessionInfo.teacher!.email
          name = session.SessionInfo.teacher!.name
        }
        if (requestedBy === RoleType.TEACHER) {
          email = session.SessionInfo.user!.email
          name = session.SessionInfo.user!.name
        }
        await new Mail(email, name).sendSessionRescheduleRequestMail({
          receiverName: session.SessionInfo.user!.name,
          sessionOldDate,
          newDateStartRange,
          newDateEndRange,
        })
        logger.info("One time session reschedule request mail executed!")
        // Delete job
        job.cancel()
        logger.info("Job deleted")
      }
    )
  } catch (error: any) {
    logger.error(
      `Error while session reschedule request mail: ${error.message}`
    )
  }
}
export function scheduleSessionRescheduleRequestUpdateMailJob({
  sessionId,
  rescheduleRequestId,
  status,
  requestedBy,
}: {
  rescheduleRequestId: number
  sessionId: number
  status: string
  requestedBy: RoleType
}) {
  try {
    logger.info("in session reschedule request status update mail schedule!")
    const date = new Date(new Date().getTime() + 10000)
    let email: string, name: string
    const job = schedule.scheduleJob(
      `Reschedule Request #${sessionId}`,
      date,
      async () => {
        const session = await getOneSessionDetailsService({ sessionId })
        const rescheduleRequest = await getOneRescheduleRequestService({
          id: rescheduleRequestId,
        })
        if (requestedBy === RoleType.TEACHER) {
          email = session.SessionInfo.teacher!.email
          name = session.SessionInfo.teacher!.name
        }
        if (requestedBy === RoleType.USER) {
          email = session.SessionInfo.user!.email
          name = session.SessionInfo.user!.name
        }
        await new Mail(
          session.SessionInfo.user!.email,
          session.SessionInfo.user!.name
        ).sendSessionRescheduleRequestUpdateMail({
          status,
          receiverName: session.SessionInfo.user!.name,
          newDateStartRange: rescheduleRequest.newDateStartRange,
          newDateEndRange: rescheduleRequest.newDateEndRange,
          sessionOldDate: rescheduleRequest.oldDate,
          sessionNewDate: session.sessionDate,
        })
        logger.info("One time session reminder mail executed!")
        // Delete job
        job.cancel()
        logger.info("Job deleted")
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
    const date = new Date(new Date().getTime() + 10000)

    const job = schedule.scheduleJob(date, async () => {
      await new Mail(
        process.env.ADMIN_EMAIL as string,
        "admin"
      ).sendPayoutRequestMail({ teacherName, amount })
      logger.info("One time payout request mail executed!")
      // Delete job
      job.cancel()
      logger.info("Job deleted")
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
    const date = new Date(new Date().getTime() + 10000)

    const job = schedule.scheduleJob(date, async () => {
      await new Mail(
        teacherEmail,
        teacherName
      ).sendPayoutRequestStatusUpdatedMail({
        status,
      })
      logger.info("One payout status updated mail executed!")
      // Delete job
      job.cancel()
      logger.info("Job deleted")
    })
  } catch (error: any) {
    logger.error(`Error while payout status updated mail: ${error.message}`)
  }
}
export function rescheduleReminderJob({
  sessionId,
  newDate,
}: {
  sessionId: number
  newDate: Date
}) {
  const jobs = schedule.scheduledJobs
  const job = jobs[`session #${sessionId}`]
  if (job) job.reschedule(newDate.toISOString())
}
