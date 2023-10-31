import catchAsync from "../utils/catchAsync"
import { NextFunction, Request, Response } from "express"
import AppError from "../utils/AppError"
import {
  IUpdateReq,
  acceptSessionRequestService,
  checkPreviousReq,
  createSessionRequestService,
  getAllSessionsRequestService,
  getOneSessionRequestService,
  updateSessionRequestService,
} from "../service/sessionReq.service"
import Session, { SessionStatus, SessionType } from "../db/models/session.model"
import {
  checkUserSubscription,
  getUserByIdService,
  sessionPerWeekEqualDates,
} from "../service/user.service"
import User from "../db/models/user.model"
import { getUserAttr } from "./user.controller"
import { checkDateFormat } from "../service/session.service"
import { sequelize } from "../db/sequalize"

export const requestSession = (type: SessionType) =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { userId, sessionDates } = req.body
    if (!Array.isArray(sessionDates)) {
      throw new AppError(400, "Please provide dateList as list or array!")
    }
    if (type === SessionType.FREE) {
      await checkPreviousReq({ userId, type: SessionType.FREE })
    } else if (type === SessionType.PAID) {
      await checkPreviousReq({ userId, type: SessionType.PAID })
      await checkUserSubscription({ userId })
      await sessionPerWeekEqualDates({
        userId,
        sessionDatesLength: sessionDates.length,
      })
    }
    const newSessionDates: Date[] = []

    for (let date of sessionDates) {
      checkDateFormat(date)
      console.log(date)
      newSessionDates.push(new Date(date))
    }

    const t = await sequelize.transaction()
    try {
      const requestSession = await createSessionRequestService({
        body: { userId, sessionDates: newSessionDates, type },
        transaction: t,
      })
      if (!requestSession) {
        return next(
          new AppError(
            400,
            "Can't create the request free session some thing wrong happened!"
          )
        )
      }
      if (type === SessionType.FREE) {
        await User.decrement(
          { availableFreeSession: 1 },
          {
            where: { id: userId },
            transaction: t, // Pass the transaction
          }
        )
      }
      await t.commit()
      res.status(201).json({ status: "success", data: requestSession })
    } catch (error: any) {
      await t.rollback()
      throw new AppError(400, `Error Request Session! ${error.message}`)
    }
  })
export const getAllAvailableSessionsReq = (type: SessionType) =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const sessions = await getAllSessionsRequestService({
      findOptions: {
        where: { type, status: SessionStatus.PENDING },
      },
    })
    res
      .status(200)
      .json({ status: "success", length: sessions.length, data: sessions })
  })
export const getAllSessionsReq = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const sessions = await getAllSessionsRequestService({
      findOptions: { include: { model: User, attributes: getUserAttr } },
    })
    res
      .status(200)
      .json({ status: "success", length: sessions.length, data: sessions })
  }
)
export const getOneSessionReq = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id
    const sessionReq = await getOneSessionRequestService({ id: +id }) //  "+" to convert id to number
    res.status(200).json({ status: "success", data: sessionReq })
  }
)
export const updateSessionReq = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { sessionDates, status, sessionStartTime } = req.body
    const body: IUpdateReq = { sessionDates, status, sessionStartTime }
    const newSessionDates: Date[] = []
    if (sessionDates && !Array.isArray(sessionDates)) {
      throw new AppError(400, "Please provide dateList as list or array!")
    }
    if (sessionDates) {
      for (let date of sessionDates) {
        checkDateFormat(date)
        console.log(date)
        newSessionDates.push(new Date(date))
      }
    }
    const sessionReq = await updateSessionRequestService({
      id: +req.params.id,
      updateBody: body,
    })
    res.status(200).json({
      status: "success",
      message: "request updated successfully!",
      data: sessionReq,
    })
  }
)
export const acceptSessionReq = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { teacherId, sessionReqId } = req.body
    const sessions = await acceptSessionRequestService({
      sessionReqId: +sessionReqId,
      teacherId: teacherId as string,
    })
    res.status(201).json({
      status: "success",
      message: "request accepted and the session are placed!",
      length: Array.isArray(sessions) ? sessions.length : 1,
      sessions,
    })
  }
)
