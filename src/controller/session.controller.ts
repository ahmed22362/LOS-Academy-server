import { NextFunction, Request, Response } from "express"
import catchAsync from "../utils/catchAsync"

export const getAllFreeSessions = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // const sessions = await getAllFreeSessionsService({})
    res.status(200)
    // .json({ status: "success", length: sessions.length, data: sessions })
  }
)
export const updateFreeSession = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const status = req.body.status
    const id = req.params.id
    // const freeSession = await updateFreeSessionReqStatusService({
    //   id: +id,
    //   status,
    // })
    // res.status(200).json({ status: "success", data: freeSession })
  }
)
