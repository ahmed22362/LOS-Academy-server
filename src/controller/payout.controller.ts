import { Request, Response, NextFunction } from "express"
import catchAsync from "../utils/catchAsync"
import {
  getTeacherByIdService,
  updateTeacherBalance,
} from "../service/teacher.service"
import AppError from "../utils/AppError"
import {
  createPayoutRequestService,
  getAllPayoutRequestService,
  getOnePayoutRequestService,
  updatePayoutRequestService,
} from "../service/payout.service"
import { PayoutRequestStatus } from "../db/models/payoutReq.model"
import { sequelize } from "../db/sequelize"

export const createPayoutRequest = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { amount, teacherId } = req.body
    const teacher = await getTeacherByIdService({ id: teacherId })
    if (amount > teacher.balance) {
      return next(
        new AppError(400, "Can't request payout more than your balance!")
      )
    }
    const payOutRequest = await createPayoutRequestService({
      teacherId,
      amount,
    })
    res.status(200).json({
      status: "success",
      message: "The Request placed successfully and waiting for admin response",
      data: payOutRequest,
    })
  }
)
export const getAllPayoutRequests = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    let page = req.query.page
    let limit = req.query.limit
    let nPage
    let nLimit
    if (page && limit) {
      nPage = Number(page)
      nLimit = Number(limit)
    }
    const requests = await getAllPayoutRequestService({
      page: nPage,
      limit: nLimit,
    })
    res
      .status(200)
      .json({ status: "success", length: requests.length, data: requests })
  }
)
export const getOnePayoutRequest = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id
    const request = await getOnePayoutRequestService({ requestId: +id })
    res.status(200).json({ status: "success", data: request })
  }
)
export const updateAmountPayoutRequest = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { amount } = req.body
    const id = req.params.id
    const payoutReq = await getOnePayoutRequestService({ requestId: +id })
    if (payoutReq.status !== PayoutRequestStatus.PENDING) {
      return next(
        new AppError(
          401,
          "Can't update amount of payout request while it's not pending"
        )
      )
    }
    const teacher = await getTeacherByIdService({ id: payoutReq.teacherId })
    if (amount > teacher.balance) {
      return next(
        new AppError(400, "Can't request payout more than your balance!")
      )
    }
    const updatedRequest = await updatePayoutRequestService({
      requestId: payoutReq.id,
      amount,
    })
    res.status(200).json({
      status: "success",
      message: "request updated successfully!",
      updatedRequest,
    })
  }
)
export const updateStatusPayoutRequestService = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { status, requestId } = req.body

    const t = await sequelize.transaction()
    try {
      const updatedRequest = await updatePayoutRequestService({
        requestId: +requestId,
        status,
        transaction: t,
      })
      if (updatedRequest.status === PayoutRequestStatus.DONE) {
        return next(new AppError(400, "Can't update a status of done request"))
      }
      if (status === PayoutRequestStatus.DONE) {
        await updateTeacherBalance({
          teacherId: updatedRequest.teacherId,
          amount: -updatedRequest.amount,
          transaction: t,
        })
      }
      await t.commit()
      res.status(200).json({
        status: "success",
        message: "request updated successfully!",
        updatedRequest,
      })
    } catch (error: any) {
      await t.rollback()
      next(new AppError(400, `Error updating balance ${error.message}`))
    }
  }
)
