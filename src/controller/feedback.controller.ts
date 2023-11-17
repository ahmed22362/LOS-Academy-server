import { NextFunction, Request, Response } from "express"
import catchAsync from "../utils/catchAsync"
import {
  createFeedBackService,
  deleteFeedBackService,
  getAllFeedBacksService,
  getFeedBackService,
  updateFeedBackService,
} from "../service/feedback.service"

export const createFeedBack = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId, feedBack } = req.body
    const feedBackInstance = await createFeedBackService({
      body: { userId, feedBack },
    })
    res.status(201).json({
      status: "success",
      message: "feedBack created successfully!",
      data: feedBackInstance,
    })
  }
)
export const getAllFeedBacks = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    let page = req.query.page
    let limit = req.query.limit
    let nPage
    let nLimit
    if (page && limit) {
      nPage = Number(page)
      nLimit = Number(limit)
    }
    const feedBacks = await getAllFeedBacksService({
      page: nPage,
      limit: nLimit,
    })
    res
      .status(200)
      .json({ status: "success", length: feedBacks.length, data: feedBacks })
  }
)
export const getFeedBack = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id
    const feedBack = await getFeedBackService({ id: +id })
    res.status(200).json({ status: "success", data: feedBack })
  }
)
export const updateFeedBack = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id
    const { show, feedBack } = req.body
    const feedBackInstance = await updateFeedBackService({
      id: +id,
      updatedData: { show },
    })
    res.status(200).json({ status: "success", data: feedBackInstance })
  }
)
export const deleteFeedBack = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id
    const feedBack = await getFeedBackService({ id: +id })
    await deleteFeedBackService({
      id: feedBack?.id,
    })
    res
      .status(200)
      .json({ status: "success", message: "feedBack deleted successfully" })
  }
)
