import catchAsync from "../utils/catchAsync"
import { NextFunction, Request, Response } from "express"
import AppError from "../utils/AppError"
import {
  IUpdateReq,
  acceptSessionRequestService,
  checkPreviousFreeReq,
  createSessionRequestService,
  getAllSessionsRequestService,
  getOneSessionRequestService,
  updateSessionRequestService,
} from "../service/sessionReq.service"
import { SessionStatus, SessionType } from "../db/models/session.model"
import { getUserByIdService } from "../service/user.service"
import User from "../db/models/user.model"
import { getUserAttr } from "./user.controller"

export const requestSession = (type: SessionType) =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { userId, date } = req.body
    if (type === SessionType.FREE) {
      await checkPreviousFreeReq({ userId })
    }
    const requestFreeSession = await createSessionRequestService({
      body: { userId, date, type },
    })
    if (!requestFreeSession) {
      return next(
        new AppError(
          400,
          "Can't create the request free session some thing wrong happened!"
        )
      )
    }
    const user = await getUserByIdService({ userId })
    await user?.decrement("availableFreeSession")
    res.status(201).json({ status: "success", data: requestFreeSession })
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
    const { sessionReqId, date, status } = req.body
    const body: IUpdateReq = { date, status }
    const sessionReq = await updateSessionRequestService({
      id: sessionReqId,
      updateBody: body,
    })
    res.status(200).json({
      status: "success",
      message: "request updated successfully!",
      data: sessionReq,
    })
  }
)
export const acceptSessionReq = (type: SessionType) =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { teacherId, sessionReqId } = req.body

    // const session = await acceptSessionRequestService({sessionReqId,teacherId,})
  })
