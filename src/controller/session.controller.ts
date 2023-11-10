import { NextFunction, Request, Response } from "express"
import catchAsync from "../utils/catchAsync"
import {
  checkDateFormat,
  createPaidSessionsService,
  generateMeetingLinkAndUpdateSession,
  getAllSessionsServiceByStatus,
  getOneSessionDetailsService,
  getTeacherAllSessionsService,
  teacherOwnThisSession,
  updateSessionStatusService,
  updateSessionStudentAttendanceService,
  updateSessionTeacherAttendanceService,
} from "../service/session.service"
import { sequelize } from "../db/sequelize"
import AppError from "../utils/AppError"
import { IRequestWithUser } from "./auth.controller"
import {
  acceptOrDeclineRescheduleRequestService,
  getAllRescheduleRequestsService,
  getPendingRequestBySessionId,
  requestRescheduleService,
} from "../service/rescheduleReq.service"
import { RescheduleRequestStatus } from "../db/models/rescheduleReq.model"
import Session, { SessionStatus } from "../db/models/session.model"
import { updateTeacherBalance } from "../service/teacher.service"
import { updateUserRemainSessionService } from "../service/user.service"
import SessionInfo from "../db/models/sessionInfo.model"
import User from "../db/models/user.model"
import { getUserAttr } from "./user.controller"
import Teacher from "../db/models/teacher.model"
import { getTeacherAtt } from "./teacher.controller"

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
export const createPaidSessionAdmin = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const {
      userId,
      teacherId,
      sessionDates,
      sessionReqId,
      sessionDuration,
      sessionCount,
      sessionsPerWeek,
    } = req.body

    const t = await sequelize.transaction()
    try {
      const session = createPaidSessionsService({
        userId,
        teacherId,
        sessionCount,
        sessionDates,
        sessionReqId,
        sessionDuration,
        sessionsPerWeek,
        transaction: t,
      })
      await t.commit()
      res.status(201).json({ status: "success", data: session })
    } catch (error) {
      await t.rollback()
      throw new AppError(400, `Error creating session!`)
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
    }
    if (req.teacher) {
      await updateSessionTeacherAttendanceService({
        sessionId,
        teacherId: req.teacher.id,
        attend: true,
        transaction: t,
      })
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
    const sessionId = req.body.sessionId
    const teacherId = req.body.teacherId
    const sessions = await getTeacherAllSessionsService({ teacherId })
    const allSessions = Object.values(sessions).flatMap((sessions) => sessions)
    const allSessionsIds = allSessions.map((session) => session.id)
    if (!allSessionsIds.includes(sessionId)) {
      return next(
        new AppError(
          401,
          "You cant generate meeting link to a session is not yours"
        )
      )
    }
    const session = allSessions.find((s) => s.id === sessionId)
    if (!(session?.teacherAttended && session.studentAttended)) {
      next(
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
      if (
        session.status !== SessionStatus.PENDING &&
        session.status !== SessionStatus.ONGOING
      ) {
        return next(new AppError(400, "Session already updated!"))
      }
      await updateSessionStatusService({
        id: sessionId,
        updatedData: { status },
        teacherId: teacherId,
        transaction: t,
      })
      if (status === SessionStatus.TAKEN) {
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
      await t.commit()
      const updatedSession = await getOneSessionDetailsService({
        sessionId: session.id,
      })
      res.status(200).json({
        status: "success",
        message:
          "session status updated successfully and the teacher take his money and the user remain sessions decreased by one!",
        data: updatedSession,
      })
    } catch (error: any) {
      await t.rollback()
      next(new AppError(400, `Error updating session: ${error.message}`))
    }
  }
)
export const requestSessionReschedule = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId, sessionId, newDate } = req.body
    checkDateFormat(newDate)
    const previousRequest = await getPendingRequestBySessionId({ sessionId })
    if (previousRequest) {
      return next(
        new AppError(
          400,
          "Can't request another reschedule before the previous request has response"
        )
      )
    }
    const rescheduleReq = await requestRescheduleService({
      sessionId,
      userId,
      newDate,
    })
    res.status(200).json({
      status: "success",
      message: "Reschedule Requested successfully!",
      data: rescheduleReq,
    })
  }
)
export const getAllRescheduleRequests = catchAsync(
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
    const { teacherId, rescheduleRequestId } = req.body
    const rescheduledSession = await acceptOrDeclineRescheduleRequestService({
      requestId: rescheduleRequestId,
      teacherId,
      status,
    })
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
