import { NextFunction, Request, Response } from "express"
import catchAsync from "../utils/catchAsync"
import {
  createPlanService,
  deletePlanService,
  getPlanService,
  getPlansService,
  updatePlanService,
} from "../service/plan.service"
import AppError from "../utils/AppError"

export interface planCreateInput {
  sessionDuration: number
  sessionsCount: number
  sessionsPerWeek: number
  title: string
}

export const createPlan = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { sessionsCount, sessionDuration, title, sessionsPerWeek } = req.body
    const body: planCreateInput = {
      sessionDuration,
      sessionsCount,
      sessionsPerWeek,
      title,
    }
    const plan = await createPlanService({ data: body })
    if (!plan) {
      return next(new AppError(400, "Can't create Plan Some thing went wrong!"))
    }
    res.status(200).json({ status: "success", data: plan })
  }
)

export const getPlans = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const plans = await getPlansService({})
    if (!plans) {
      return next(
        new AppError(400, "something wrong happened while getting plans")
      )
    }
    res.status(200).json({ status: "success", data: plans })
  }
)
export const updatePlan = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { totalDuration, totalSession, active, title } = req.body
    const id = req.params.id
    const data = {
      totalDuration,
      totalSession,
      active,
      title,
    }
    const updatedPlan = await updatePlanService({ id, updatedData: data })
    if (!updatedPlan) {
      return next(new AppError(404, "can't find plan to update"))
    }
    res.status(200).json({ status: "success", data: updatedPlan })
  }
)

export const deletePlan = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id
    await deletePlanService({ id })
    res
      .status(200)
      .json({ status: "success", message: "plan deleted successfully" })
  }
)

export const getPlan = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id
    const plan = await getPlanService({ id })
    if (!plan) {
      return next(new AppError(404, "can't find plan with this id!"))
    }
    res.status(200).json({ status: "success", data: plan })
  }
)
