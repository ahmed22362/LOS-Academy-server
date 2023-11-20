import { NextFunction, Request, Response } from "express"
import catchAsync from "../utils/catchAsync"
import {
  createFeedBackService,
  deleteFeedBackService,
  getAllFeedBacksService,
  getFeedBackService,
  updateFeedBackService,
} from "../service/feedback.service"
import AppError from "../utils/AppError"

export const createFeedBack = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId, feedback } = req.body
    const feedbackInstance = await createFeedBackService({
      body: { userId, feedback },
    })
    res.status(201).json({
      status: "success",
      message: "feedback created successfully!",
      data: feedbackInstance,
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
    const feedbacks = await getAllFeedBacksService({
      page: nPage,
      limit: nLimit,
    })
    res
      .status(200)
      .json({ status: "success", length: feedbacks.length, data: feedbacks })
  }
)
export const getFeedBack = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id
    const feedback = await getFeedBackService({ id: +id })
    if (!feedback) {
      return next(new AppError(404, "There is no feedback with this id!"))
    }
    res.status(200).json({ status: "success", data: feedback })
  }
)
export const updateFeedBack = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id
    const { show, feedback } = req.body
    const feedbackInstance = await updateFeedBackService({
      id: +id,
      updatedData: { show, feedback },
    })
    res.status(200).json({ status: "success", data: feedbackInstance })
  }
)
export const deleteFeedBack = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id
    const feedback = await getFeedBackService({ id: +id })
    await deleteFeedBackService({
      id: feedback?.id,
    })
    res
      .status(200)
      .json({ status: "success", message: "feedback deleted successfully" })
  }
)
