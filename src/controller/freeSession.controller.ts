import { NextFunction, Request, Response } from "express"
import catchAsync from "../utils/catchAsync"
import AppError from "../utils/AppError"
import {
  DATE_PATTERN,
  acceptAndCreateFreeSessionService,
  getAllFreeSessionsReqService,
  getAllFreeSessionsService,
  getAvailableFreeSessionsReq,
  requestFreeSessionService,
  updateFreeSessionStatusService,
} from "../service/freeSession.service"

export const requestFreeSession = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId, date } = req.body
    if (!DATE_PATTERN.test(date)) {
      const errorMessage =
        "Input does not match the pattern. Please use the format 'YYYY-MM-DD HH:MM:SS'"
      return next(new AppError(400, errorMessage))
    }
    const requestFreeSession = await requestFreeSessionService({ userId, date })
    if (!requestFreeSession) {
      return next(
        new AppError(
          400,
          "Can't create the request free session some thing wrong happened!"
        )
      )
    }
    res.status(201).json({ status: "success", data: requestFreeSession })
  }
)
export const getAllAvailableFreeSessionsReq = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const sessions = await getAvailableFreeSessionsReq()
    res
      .status(200)
      .json({ status: "success", length: sessions.length, data: sessions })
  }
)
export const getAllFreeSessionsReq = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const sessions = await getAllFreeSessionsReqService()
    res
      .status(200)
      .json({ status: "success", length: sessions.length, data: sessions })
  }
)
export const acceptAndCreateFreeSession = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const freeSessionReqId = req.body.freeSessionReqId as number
    const teacherId = req.body.teacherId
    const { freeSession, session } = await acceptAndCreateFreeSessionService({
      freeSessionReqId,
      teacherId,
    })
    res.status(201).json({ status: "success", data: { session, freeSession } })
  }
)
export const getAllFreeSessions = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const sessions = await getAllFreeSessionsService({})
    res
      .status(200)
      .json({ status: "success", length: sessions.length, data: sessions })
  }
)
export const updateFreeSession = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const status = req.body.status
    const id = req.params.id
    const freeSession = await updateFreeSessionStatusService({
      id: +id,
      status,
    })
    res.status(200).json({ status: "success", data: freeSession })
  }
)
