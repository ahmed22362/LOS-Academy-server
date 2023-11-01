import { NextFunction, Request, Response } from "express"
import catchAsync from "../utils/catchAsync"
import {
  createPaidSessionsService,
  generateMeetingLinkAndUpdateSession,
  getAllSessionWithDetailsService,
  getOneSessionDetailsService,
  getTeacherAllSessionsService,
  updateSessionStatusService,
  updateSessionStudentAttendanceService,
  updateSessionTeacherAttendanceService,
} from "../service/session.service"
import { sequelize } from "../db/sequalize"
import AppError from "../utils/AppError"
import { IRequestWithUser } from "./auth.controller"

export const getAllSessions = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const sessions = await getAllSessionWithDetailsService()
    res
      .status(200)
      .json({ status: "success", length: sessions.length, data: sessions })
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
    const allSessionsId = Object.values(sessions)
      .flatMap((sessions) => sessions)
      .map((s) => s.id)
    if (!allSessionsId.includes(sessionId)) {
      return next(
        new AppError(
          401,
          "You cant generate meeting link to a session is not yours"
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
    const sessionId = req.body.sessionId
    const status = req.body.status
    const session = await updateSessionStatusService({
      id: sessionId,
      updatedData: { status },
      teacherId: req.body.teacherId,
    })
    res.status(200).json({
      status: "success",
      message: "session status updated successfully",
      data: session,
    })
  }
)
