import Mail from "../connect/sendMail"
import { RescheduleRequestStatus } from "../db/models/rescheduleReq.model"
import { scheduledJobStatus } from "../db/models/scheduleJob.model"
import { SessionStatus, SessionType } from "../db/models/session.model"
import { RoleType } from "../db/models/teacher.model"
import { sequelize } from "../db/sequelize"
import {
  getOneRescheduleRequestService,
  updateRescheduleRequestService,
} from "../service/rescheduleReq.service"
import {
  deleteJobService,
  updateJobService,
} from "../service/scheduleJob.service"
import {
  generateMeetingLinkAndUpdateSession,
  getOneSessionDetailsService,
  updateSessionService,
} from "../service/session.service"
import { updateTeacherBalance } from "../service/teacher.service"
import { updateUserRemainSessionService } from "../service/user.service"
import AppError from "./AppError"
import logger from "./logger"

interface JobCallback {
  (...args: any[]): Promise<void>
}
export const callbacksNames = {
  SESSION_REMINDER_MAIL: "Reminder Mail",
  SESSION_STARTED_MAIL: "Session Started Mail",
  UPDATE_SESSION_TO_ONGOING: "Session Is Ongoing",
  UPDATE_SESSION_TO_FINISHED: "Session Is Finished",
  UPDATE_SESSION_RESCHEDULE_STATUS: "Reschedule Request Updating",
}

const jobCallbacks = new Map<string, JobCallback>()

const sessionReminderEmail: JobCallback = async function ({
  sessionDate,
  studentName,
  studentEmail,
  teacherName,
  teacherEmail,
  jobId,
}: {
  sessionDate: Date
  sessionId: number
  studentName: string
  studentEmail: string
  teacherName: string
  teacherEmail: string
  jobId: number
}) {
  try {
    await new Mail(studentEmail, studentName).sendSessionReminderMail({
      sessionDate: sessionDate.toUTCString(),
    })
    await new Mail(teacherEmail, teacherName).sendSessionReminderMail({
      sessionDate: sessionDate.toUTCString(),
    })
    logger.info("One time session reminder mail executed!")
    await deleteJobService({ id: jobId })
  } catch (error: any) {
    await updateJobService({
      id: jobId,
      updatedData: { status: scheduledJobStatus.FAILED },
    })
    logger.error(`Can't Send session reminder mail: ${error}`)
  }
}
const sessionStartedEmail: JobCallback = async function ({
  sessionId,
  jobId,
}: {
  sessionId: number
  jobId: number
}) {
  const session = await getOneSessionDetailsService({ sessionId })
  try {
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
        whoMiss: RoleType.USER,
        sessionDate: session.sessionDate.toUTCString(),
      })
    }
    if (!session.teacherAttended) {
      await new Mail(
        session.SessionInfo.teacher!.email,
        session.SessionInfo.teacher!.name
      ).sendSessionStartReminderForUser({
        sessionDate: session.sessionDate.toUTCString(),
      })
      await new Mail(
        process.env.ADMIN_EMAIL as string,
        "Admin"
      ).sendSessionStartReminderForAdmin({
        userName: session.SessionInfo.user!.name,
        teacherName: session.SessionInfo.teacher!.name,
        whoMiss: RoleType.TEACHER,
        sessionDate: session.sessionDate.toUTCString(),
      })
    }
    logger.info("One time session started reminder mail executed!")
    await deleteJobService({ id: jobId })
  } catch (error: any) {
    await updateJobService({
      id: jobId,
      updatedData: { status: scheduledJobStatus.FAILED },
    })
    logger.error(`Can't send session started reminder mail: ${error}`)
  }
}
const sessionUpdateToOngoing: JobCallback = async function ({
  sessionId,
  jobId,
}: {
  sessionId: number
  jobId: number
}) {
  try {
    await generateMeetingLinkAndUpdateSession({
      sessionId,
      status: SessionStatus.ONGOING,
    })
    logger.info("One time session updated to ongoing executed!")

    await deleteJobService({ id: jobId })
  } catch (error: any) {
    await updateJobService({
      id: jobId,
      updatedData: { status: scheduledJobStatus.FAILED },
    })
    logger.error(
      `Can't update Session to be ongoing or generating the link try manually: ${error}`
    )
  }
}
const sessionUpdateToFinished: JobCallback = async function ({
  sessionId,
  jobId,
}: {
  sessionId: number
  jobId: number
}) {
  const session = await getOneSessionDetailsService({ sessionId })
  const transaction = await sequelize.transaction()
  try {
    if (!session.studentAttended) {
      logger.info("student absent")
      await updateSessionService({
        sessionId,
        updatedData: { status: SessionStatus.USER_ABSENT },
        transaction,
      })
      if (session.type === SessionType.PAID) {
        await updateTeacherBalance({
          teacherId: session.SessionInfo.teacherId!,
          numOfSessions: 1,
          transaction,
        })
        await updateUserRemainSessionService({
          userId: session.SessionInfo.userId!,
          amountOfSessions: -1,
          transaction,
        })
      }
    }
    if (!session.teacherAttended) {
      logger.info("teacher absent")
      await updateSessionService({
        sessionId,
        updatedData: { status: SessionStatus.TEACHER_ABSENT },
        transaction,
      })
      await updateTeacherBalance({
        teacherId: session.SessionInfo.teacherId!,
        committed: false,
        numOfSessions: -1,
        transaction,
      })
    }
    if (session.studentAttended && session.teacherAttended) {
      logger.info("both attended")

      await updateSessionService({
        sessionId,
        updatedData: { status: SessionStatus.TAKEN },
        transaction,
      })
      if (session.type === SessionType.PAID) {
        await updateUserRemainSessionService({
          userId: session.SessionInfo.userId!,
          amountOfSessions: -1,
          transaction,
        })
      }
    }
    await transaction.commit()
    await deleteJobService({ id: jobId })
    logger.info(`One time session Finished with status executed!`)
  } catch (error: any) {
    await updateJobService({
      id: jobId,
      updatedData: { status: scheduledJobStatus.FAILED },
    })
    await transaction.rollback()
    logger.error(`Can't update the fished session's status: ${error}`)
  }
}
// handel no response requests
const rescheduleRequestUpdate: JobCallback = async function ({
  rescheduleRequestId,
  jobId,
}: {
  rescheduleRequestId: number
  jobId: number
}) {
  const request = await getOneRescheduleRequestService({
    id: rescheduleRequestId,
  })
  if (request.status === RescheduleRequestStatus.PENDING) {
    await updateRescheduleRequestService({
      requestId: rescheduleRequestId,
      status: RescheduleRequestStatus.NO_RESPONSE,
    })
    logger.info("One time reschedule Request updated to no response executed!")
  }

  await deleteJobService({ id: jobId })
  logger.info(
    "One time reschedule Request job executed already responded request!"
  )
}
jobCallbacks.set(callbacksNames.SESSION_REMINDER_MAIL, sessionReminderEmail)
jobCallbacks.set(callbacksNames.SESSION_STARTED_MAIL, sessionStartedEmail)
jobCallbacks.set(
  callbacksNames.UPDATE_SESSION_TO_ONGOING,
  sessionUpdateToOngoing
)
jobCallbacks.set(
  callbacksNames.UPDATE_SESSION_TO_FINISHED,
  sessionUpdateToFinished
)
jobCallbacks.set(
  callbacksNames.UPDATE_SESSION_RESCHEDULE_STATUS,
  rescheduleRequestUpdate
)

export default jobCallbacks
