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

    const requestSession = await createSessionRequestService({
      body: { userId, sessionDates: newSessionDates, type },
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
      const user = await getUserByIdService({ userId })
      await user?.decrement("availableFreeSession")
    }
    res.status(201).json({ status: "success", data: requestSession })
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
    const { sessionDates, status } = req.body
    const body: IUpdateReq = { sessionDates, status }
    const newSessionDates: Date[] = []
    if (!Array.isArray(sessionDates)) {
      throw new AppError(400, "Please provide dateList as list or array!")
    }
    for (let date of sessionDates) {
      checkDateFormat(date)
      console.log(date)
      newSessionDates.push(new Date(date))
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
      length: (sessions as Session[]).length,
      sessions,
    })
  }
)
