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
  getUserSessionRequestService,
  updateSessionRequestService,
} from "../service/sessionReq.service"
import { SessionStatus, SessionType } from "../db/models/session.model"
import {
  checkUserSubscription,
  sessionPerWeekEqualDates,
} from "../service/user.service"
import User from "../db/models/user.model"
import { getUserAttr } from "./user.controller"
import { checkDateFormat } from "../service/session.service"
import { sequelize } from "../db/sequelize"

export const requestSession = (type: SessionType) =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { userId, sessionDates } = req.body
    if (!Array.isArray(sessionDates)) {
      throw new AppError(400, "Please provide sessionDates as list or array!")
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
    const sessions = await getAllSessionsRequestService({
      findOptions: {
        where: { type, status: SessionStatus.PENDING },
        include: { model: User, attributes: getUserAttr },
        limit: nLimit,
        offset,
      },
    })
    res
      .status(200)
      .json({ status: "success", length: sessions.length, data: sessions })
  })
export const getAllSessionsReq = catchAsync(
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
    const sessions = await getAllSessionsRequestService({
      findOptions: {
        include: { model: User, attributes: getUserAttr },
        limit: nLimit,
        offset,
      },
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
export const updateSessionReqDate = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { sessionDates, sessionStartTime } = req.body
    const id = req.params.id
    const body: IUpdateReq = { sessionDates, sessionStartTime }
    const newSessionDates: Date[] = []
    if (sessionDates && !Array.isArray(sessionDates)) {
      throw new AppError(400, "Please provide dateList as list or array!")
    }
    if (sessionDates) {
      for (let date of sessionDates) {
        checkDateFormat(date)
        newSessionDates.push(new Date(date))
      }
    }
    console.log(newSessionDates)
    const sessionRequest = await getOneSessionRequestService({ id: +id })
    if (sessionRequest.type === SessionType.FREE) {
      body.sessionDates = [newSessionDates[0]]
    }
    console.log(body)
    const sessionRequestUpdated = await updateSessionRequestService({
      id: +id,
      updateBody: body,
    })
    res.status(200).json({
      status: "success",
      message: "request Time updated successfully!",
      data: sessionRequestUpdated,
    })
  }
)
export const updateSessionReqStatus = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { status } = req.body
    const body: IUpdateReq = { status }
    const sessionReq = await updateSessionRequestService({
      id: +req.params.id,
      updateBody: body,
    })
    res.status(200).json({
      status: "success",
      message: "request status updated successfully!",
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
export const getUserSessionReq = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.body
    const requests = await getUserSessionRequestService({ userId })
    res.status(200).json({ status: "success", data: requests })
  }
)
