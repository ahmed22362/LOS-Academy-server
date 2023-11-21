import { NextFunction, Request, Response } from "express"
import catchAsync from "../utils/catchAsync"
import {
  canRescheduleSession,
  checkDateFormat,
  createPaidSessionsService,
  generateMeetingLinkAndUpdateSession,
  getAdminSessionsStatisticsService,
  getAllSessionsServiceByStatus,
  getOneSessionDetailsService,
  getOneSessionService,
  isSessionAfterItsTimeRange,
  isSessionWithinTimeRange,
  isThereOngoingSessionForTheSameTeacher,
  teacherOwnThisSession,
  updateSessionStatusService,
  updateSessionStudentAttendanceService,
  updateSessionTeacherAttendanceService,
} from "../service/session.service"
import { sequelize } from "../db/sequelize"
import AppError from "../utils/AppError"
import { IRequestWithUser } from "./auth.controller"
import {
  getAllRescheduleRequestsService,
  getPendingRequestBySessionIdService,
  teacherAcceptOrDeclineRescheduleRequestService,
  teacherRequestRescheduleService,
  userAcceptOrDeclineRescheduleRequestService,
  userRequestRescheduleService,
} from "../service/rescheduleReq.service"
import { RescheduleRequestStatus } from "../db/models/rescheduleReq.model"
import Session, { SessionStatus, SessionType } from "../db/models/session.model"
import { updateTeacherBalance } from "../service/teacher.service"
import {
  checkUserSubscription,
  getUserByIdService,
  sessionPerWeekEqualDates,
  updateUserRemainSessionService,
  updateUserService,
} from "../service/user.service"
import SessionInfo from "../db/models/sessionInfo.model"
import User from "../db/models/user.model"
import { getUserAttr } from "./user.controller"
import Teacher, { RoleType } from "../db/models/teacher.model"
import { getTeacherAtt } from "./teacher.controller"
import {
  rescheduleReminderJob,
  scheduleSessionRescheduleRequestMailJob,
  scheduleSessionRescheduleRequestUpdateMailJob,
} from "../utils/scheduler"
import {
  createSessionInfoService,
  getOneSessionInfoServiceBy,
  getSessionInfoService,
  updateSessionInfoService,
} from "../service/sessionInfo.service"
import { createSessionRequestService } from "../service/sessionReq.service"
export const THREE_MINUTES_IN_MILLISECONDS = 3 * 60 * 1000

const DEFAULT_COURSES = ["arabic"]
export const getAllSessions = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    let page = req.query.page
    let limit = req.query.limit
    let nPage
    let nLimit
    if (page && limit) {
      nPage = Number(page)
      nLimit = Number(limit)
    }
    const sessions = await getAllSessionsServiceByStatus({})
    res
      .status(200)
      .json({ status: "success", length: sessions.length, data: sessions })
  }
)
export const getAllSessionsByStatus = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const status = req.query.status as SessionStatus
    let page = req.query.page
    let limit = req.query.limit
    let nPage
    let nLimit
    if (page && limit) {
      nPage = Number(page)
      nLimit = Number(limit)
    }
    const sessions = await getAllSessionsServiceByStatus({
      status: status,
      page: nPage,
      pageSize: nLimit,
    })
    res.status(200).json({
      status: "success",
      length: sessions.length,
      data: sessions,
    })
  }
)
export const getOneSessionInfo = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const sessionId = req.params.id
    const session = await getOneSessionDetailsService({ sessionId: +sessionId })
    res.status(200).json({ status: "success", data: session })
  }
)
export const replaceSessionInfoTeacher = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { sessionId, teacherId } = req.body
    const session = await getOneSessionService({ sessionId })
    const sessionInfo = await getSessionInfoService({
      id: session.sessionInfoId,
    })
    const updatedSessionInfo = await updateSessionInfoService({
      id: sessionInfo.id,
      updatedData: { teacherId },
    })
    res.status(200).json({
      status: "success",
      message: "Session info updated successfully and the teacher has changed",
      data: updatedSessionInfo,
    })
  }
)
export const createPaidSessionAdmin = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    let { sessionInfoId, userId, teacherId, sessionDates, sessionDuration } =
      req.body
    let sessionReqId
    const newSessionDates: Date[] = []
    const currentDate = new Date()
    for (let date of sessionDates) {
      checkDateFormat(date)
      if (new Date(date) <= currentDate) {
        return next(
          new AppError(
            400,
            "please provide date that is in the future not in the past!"
          )
        )
      }
      newSessionDates.push(new Date(date))
    }
    if (newSessionDates.length > 1) {
      return next(
        new AppError(
          400,
          "you can only create one session per time provide one date"
        )
      )
    }
    const t = await sequelize.transaction()
    try {
      if (!sessionInfoId) {
        const sessionReq = await createSessionRequestService({
          body: {
            courses: DEFAULT_COURSES,
            userId,
            sessionDates: newSessionDates,
            type: SessionType.NOT_ASSIGN,
          },
          transaction: t,
        })
        sessionReqId = sessionReq.id
        const sessionInfo = await createSessionInfoService({
          userId,
          teacherId,
          sessionReqId,
          transaction: t,
        })
        sessionInfoId = sessionInfo.id
      }
      const session = createPaidSessionsService({
        sessionInfoId,
        sessionCount: 1,
        sessionDates,
        sessionDuration,
        sessionsPerWeek: 1,
        transaction: t,
      })
      await t.commit()
      res.status(201).json({ status: "success", data: session })
    } catch (error) {
      await t.rollback()
      return next(new AppError(400, `Error creating session!`))
    }
  }
)
export const updateSessionAttendance = async (
  req: IRequestWithUser,
  res: Response,
  next: NextFunction
) => {
  const t = await sequelize.transaction()
  try {
    const sessionId = req.body.sessionId
    if (req.user) {
      await updateSessionStudentAttendanceService({
        sessionId,
        userId: req.user.id,
        attend: true,
        transaction: t,
      })
    } else if (req.teacher) {
      await updateSessionTeacherAttendanceService({
        sessionId,
        teacherId: req.teacher.id,
        attend: true,
        transaction: t,
      })
    } else {
      return next(new AppError(400, "Can't define which user signed in!"))
    }
    await t.commit()
    res
      .status(200)
      .json({ status: "success", message: "attendance updated Successfully" })
  } catch (error: any) {
    await t.rollback()
    return next(
      new AppError(400, `Some thing went wrong like : ${error.message}`)
    )
  }
}
export const generateSessionLink = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { sessionId, teacherId } = req.body
    const { session, exist } = await teacherOwnThisSession({
      teacherId,
      sessionId,
    })
    if (!exist) {
      return next(
        new AppError(
          401,
          "You cant generate meeting link to a session is not yours"
        )
      )
    }
    if (!(session?.teacherAttended && session.studentAttended)) {
      return next(
        new AppError(
          400,
          `Can't generate link teacher and student must attend, TeacherAttend?: ${session?.teacherAttended}, StudentAttend?: ${session?.studentAttended}`
        )
      )
    }
    const updatedSession = await generateMeetingLinkAndUpdateSession({
      sessionId,
    })
    res.status(200).json({
      status: "success",
      message: "session meeting link regenerated!",
      data: updatedSession,
    })
  }
)
export const updateSessionStatus = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { sessionId, teacherId, status } = req.body
    const t = await sequelize.transaction()
    try {
      const { exist, session } = await teacherOwnThisSession({
        teacherId,
        sessionId,
      })
      if (!exist) {
        return next(
          new AppError(401, "you can't update session that is not yours")
        )
      }
      if (!session.studentAttended && status !== SessionStatus.ABSENT) {
        return next(
          new AppError(
            400,
            "user must attend before you can update the session status!"
          )
        )
      }
      if (
        session.status !== SessionStatus.PENDING &&
        session.status !== SessionStatus.ONGOING
      ) {
        return next(new AppError(400, "Session already updated!"))
      }
      if (status === SessionStatus.ONGOING) {
        await isThereOngoingSessionForTheSameTeacher({ teacherId })
        if (!isSessionWithinTimeRange(session.sessionDate)) {
          return next(
            new AppError(
              400,
              "Can't update session to be ongoing were it's time didn't come! you can always request a reschedule"
            )
          )
        }
        if (!session.meetingLink) {
          return next(
            new AppError(
              400,
              "Can't make ongoing session before generating it's link! generate the link before update it status!"
            )
          )
        }
      }
      if (
        status === SessionStatus.ABSENT &&
        !isSessionAfterItsTimeRange(
          session.sessionDate,
          session.sessionDuration
        )
      ) {
        return next(
          new AppError(
            400,
            "You have to wait till the session duration end to update the student as absent"
          )
        )
      }
      await updateSessionStatusService({
        id: sessionId,
        updatedData: { status },
        teacherId: teacherId,
        transaction: t,
      })
      if (status === SessionStatus.TAKEN) {
        if (session.status !== SessionStatus.ONGOING) {
          return next(
            new AppError(
              403,
              "Can't update session to be taken that is never started!"
            )
          )
        }
        if (session.type === SessionType.PAID) {
          await updateTeacherBalance({
            teacherId,
            numOfSessions: 1,
            transaction: t,
          })
          await updateUserRemainSessionService({
            userId: session.SessionInfo.userId as string,
            amountOfSessions: -1,
            transaction: t,
          })
        }
      }
      await t.commit()
      const updatedSession = await getOneSessionDetailsService({
        sessionId: session.id,
      })
      res.status(200).json({
        status: "success",
        message: "session status updated successfully",
        data: updatedSession,
      })
    } catch (error: any) {
      await t.rollback()
      next(new AppError(400, `Error updating session: ${error.message}`))
    }
  }
)
export const userRequestSessionReschedule = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId, sessionId, newDatesOptions } = req.body
    const session = await getOneSessionService({ sessionId })
    if (!canRescheduleSession(session.sessionDate)) {
      return next(
        new AppError(
          403,
          "Cant Request a reschedule before 10 minutes of the session!"
        )
      )
    }
    if (!Array.isArray(newDatesOptions)) {
      return next(new AppError(400, "please provide newDatesOptions as list!"))
    }
    newDatesOptions.forEach((date: string) => {
      checkDateFormat(date)
      const currentDate = new Date().getTime()
      const newSessionDate = new Date(date).getTime()
      if (
        newSessionDate <= new Date(session.sessionDate).getTime() &&
        currentDate > newSessionDate
      ) {
        return next(
          new AppError(
            400,
            "please provide date that is after the session date not before it!"
          )
        )
      }
    })
    const previousRequest = await getPendingRequestBySessionIdService({
      sessionId,
    })
    if (previousRequest) {
      return next(
        new AppError(
          400,
          "Can't request another reschedule before the previous request has response"
        )
      )
    }
    const rescheduleReq = await userRequestRescheduleService({
      sessionId,
      userId,
      newDatesOptions,
    })
    scheduleSessionRescheduleRequestMailJob({
      requestedBy: RoleType.USER as RoleType,
      sessionId,
      newDatesOptions,
      sessionOldDate: rescheduleReq.oldDate,
    })
    res.status(200).json({
      status: "success",
      message: "Reschedule Requested successfully!",
      data: rescheduleReq,
    })
  }
)
export const teacherRequestSessionReschedule = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { teacherId, sessionId, newDatesOptions } = req.body
    const session = await getOneSessionService({ sessionId })
    if (!canRescheduleSession(session.sessionDate)) {
      return next(
        new AppError(
          403,
          "Cant Request a reschedule before 10 minutes of the session!"
        )
      )
    }
    if (!Array.isArray(newDatesOptions)) {
      return next(new AppError(400, "please provide newDatesOptions as list!"))
    }
    const datesArr: Date[] = []
    newDatesOptions.forEach((date) => {
      checkDateFormat(date)
      const currentDate = new Date()
      const newSessionDate = new Date(date)
      if (
        newSessionDate.getTime() <= new Date(session.sessionDate).getTime() &&
        currentDate.getTime() > newSessionDate.getTime()
      ) {
        return next(
          new AppError(
            400,
            "please provide date that is after the session date not before it!"
          )
        )
      }
      datesArr.push(newSessionDate)
    })
    const previousRequest = await getPendingRequestBySessionIdService({
      sessionId,
    })
    if (previousRequest) {
      return next(
        new AppError(
          400,
          "Can't request another reschedule before the previous request has response"
        )
      )
    }
    const rescheduleReq = await teacherRequestRescheduleService({
      sessionId,
      teacherId,
      newDatesOptions: datesArr,
    })
    scheduleSessionRescheduleRequestMailJob({
      requestedBy: RoleType.TEACHER,
      sessionId,
      newDatesOptions,
      sessionOldDate: rescheduleReq.oldDate,
    })
    res.status(200).json({
      status: "success",
      message: "Reschedule Requested successfully!",
      data: rescheduleReq,
    })
  }
)
export const getAllRescheduleRequestsForAdmin = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    let page = req.query.page
    let limit = req.query.limit
    let nPage
    let nLimit
    let offset
    if (page && limit) {
      nPage = Number(page)
      nLimit = Number(limit)
      offset = nPage * nLimit
    }
    const requests = await getAllRescheduleRequestsService({
      findOptions: {
        limit: nLimit,
        offset,
        include: [
          {
            model: Session,
            attributes: ["sessionInfoId"],
            include: [
              {
                model: SessionInfo,
                attributes: ["userId", "teacherId"],
                include: [
                  { model: User, attributes: getUserAttr },
                  { model: Teacher, attributes: getTeacherAtt },
                ],
              },
            ],
          },
        ],
      },
    })
    res.status(200).json({ status: "success", data: requests })
  }
)
export const updateStatusSessionReschedule = (
  status: RescheduleRequestStatus
) =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { teacherId, userId, rescheduleRequestId, newDate } = req.body
    let requestedFrom
    let rescheduledSession
    if (teacherId) {
      rescheduledSession = await teacherAcceptOrDeclineRescheduleRequestService(
        {
          requestId: rescheduleRequestId,
          teacherId,
          status,
          newDate: newDate ? new Date(newDate) : undefined,
        }
      )
      requestedFrom = RoleType.TEACHER
    } else if (userId) {
      rescheduledSession = await userAcceptOrDeclineRescheduleRequestService({
        requestId: rescheduleRequestId,
        userId,
        status,
        newDate: newDate ? new Date(newDate) : undefined,
      })
      requestedFrom = RoleType.USER
    }

    scheduleSessionRescheduleRequestUpdateMailJob({
      requestedBy: requestedFrom as RoleType,
      rescheduleRequestId,
      sessionId: rescheduledSession!.id,
      status,
    })
    if (status === RescheduleRequestStatus.APPROVED) {
      rescheduleReminderJob({
        sessionId: rescheduledSession!.id,
        newDate: (rescheduledSession as Session).sessionDate,
      })
    }
    let message = "reschedule request accepted successfully"
    status === RescheduleRequestStatus.DECLINED
      ? (message = "reschedule request declined successfully!")
      : message
    res.status(200).json({
      status: "success",
      message,
      data: rescheduledSession,
    })
  })
export const userContinueWithTeacher = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { sessionId } = req.body
    const session = await getOneSessionService({ sessionId })
    const sessionInfoUpdated = await updateSessionInfoService({
      id: session.sessionInfoId,
      updatedData: { willContinue: true },
    })
    res.status(200).json({
      status: "success",
      message: `The user chose to continue with that teacher now choose plan and pay for it after the plan \n 
        go and choose the date for your sessions`,
      data: sessionInfoUpdated,
    })
  }
)
export const userPlaceHisSessions = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId, sessionDates } = req.body
    const sessionInfo = await getOneSessionInfoServiceBy({
      where: { userId, willContinue: true },
    })
    if (!sessionInfo) {
      return next(
        new AppError(
          403,
          "Can't place session dates the user didn't choose to continue with any teacher! you can request paid session"
        )
      )
    }
    const user = await getUserByIdService({ userId })
    if (user.sessionPlaced) {
      return next(
        new AppError(
          403,
          "You already placed your session wait for the next month or contact your admin"
        )
      )
    }
    const subscription = await checkUserSubscription({ userId })
    if (!Array.isArray(sessionDates)) {
      return next(
        new AppError(400, "Please provide sessionDates as list or array!")
      )
    }
    await sessionPerWeekEqualDates({
      userId,
      sessionDatesLength: sessionDates.length,
    })

    const transaction = await sequelize.transaction()
    try {
      await updateTeacherBalance({
        teacherId: sessionInfo.teacherId!,
        numOfSessions: 1,
        transaction,
      })
      const newSessionDates: Date[] = []
      const currentDate = new Date()
      for (let date of sessionDates) {
        checkDateFormat(date)
        if (new Date(date) < currentDate) {
          return next(
            new AppError(
              400,
              "please provide date that is in the future not in the past!"
            )
          )
        }
        newSessionDates.push(new Date(date))
      }
      const paidSessions = await createPaidSessionsService({
        sessionInfoId: sessionInfo.id,
        sessionDates: newSessionDates,
        sessionCount: subscription.plan.sessionsCount,
        sessionDuration: subscription.plan.sessionDuration,
        sessionsPerWeek: subscription.plan.sessionsPerWeek,
        transaction,
      })
      await updateUserService({
        userId,
        updatedData: { sessionPlaced: true },
        transaction,
      })
      await transaction.commit()
      res.status(201).json({
        status: "success",
        message: "the user placed his session successfully!",
        data: paidSessions,
      })
    } catch (error: any) {
      await transaction.rollback()
      return next(new AppError(400, `Error Placed Session: ${error.message}`))
    }
  }
)
export const getAdminSessionStats = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const sessionStats = await getAdminSessionsStatisticsService()
    res.status(200).json({ status: "success", data: sessionStats })
  }
)
