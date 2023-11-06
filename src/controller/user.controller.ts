import { NextFunction, Request, Response } from "express"
import User, { IUserInput } from "../db/models/user.model"
import catchAsync from "../utils/catchAsync"
import {
  createUserService,
  deleteUserService,
  getUserByIdService,
  getUserSubscriptionPlan,
  getUsersService,
  updateUserService,
} from "../service/user.service"
import AppError from "../utils/AppError"
import {
  IRequestWithUser,
  decodedToken,
  login,
  protect,
  restrictTo,
} from "./auth.controller"
import { createStripeBillingPortal } from "../service/stripe.service"
import {
  getUserAllDoneSessionsService,
  getUserAllSessionsService,
  getUserUpcomingSessionsService,
} from "../service/session.service"
import { SessionStatus } from "../db/models/session.model"
import { verifyToken } from "../utils/jwt"
import { getUserRescheduleRequests } from "../service/rescheduleReq.service"
export const setUserOrTeacherId = (
  req: IRequestWithUser,
  res: Response,
  next: NextFunction
) => {
  if (!req.body.user) req.body.userId = req.user?.id
  if (!req.body.teacher) req.body.teacherId = req.teacher?.id
  console.log(
    `done setting this is user: ${req.body.UserId} teacher: ${req.body.teacherId}`
  )
  next()
}
export const setUserIdToParams = (
  req: IRequestWithUser,
  res: Response,
  next: NextFunction
) => {
  if (!req.params.id) req.params.id = req.user?.id as string
  if (!req.params.id) req.params.id = req.teacher?.id as string
  next()
}
export const getUserAttr = [
  "id",
  "name",
  "phone",
  "email",
  "availableFreeSession",
  "remainSessions",
  "age",
]

export const loginUser = login(User)
export const protectUser = protect(User)
export const createUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { name, age, email, password, phone } = req.body
    const body = { name, age, email, password, phone } as IUserInput
    const newUser = await createUserService({ userData: body })
    if (!newUser) {
      return next(new AppError(400, "Can't create new User!"))
    }
    res.status(200).json({ status: "success", data: newUser })
  }
)
export const getAllUsers = catchAsync(
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
    const users = await getUsersService({
      findOptions: { attributes: getUserAttr, limit: nLimit, offset },
    })
    if (!users) {
      return next(new AppError(400, "Error getting all users!"))
    }
    res
      .status(200)
      .json({ status: "success", length: users.length, data: users })
  }
)
export const deleteUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id

    const deleteState = await deleteUserService({ userId: id })
    if (!deleteState) {
      return next(new AppError(400, "Error Deleting User!"))
    }
    res
      .status(200)
      .json({ status: "success", message: "user Deleted successfully" })
  }
)
export const updateUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id
    const { name, email, phone, age } = req.body
    const body = { name, email, phone, age } as IUserInput
    const user = await updateUserService({ userId: id, updatedData: body })
    if (!user) {
      return next(new AppError(404, "Can't find user to update!"))
    }
    res.status(200).json({
      status: "success",
      message: "user updated successfully",
      data: user,
    })
  }
)
export const getUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id
    const user = await getUserByIdService({
      userId: id,
      findOptions: { attributes: getUserAttr },
    })
    if (!user) {
      return next(new AppError(404, "Can't find user with this id!"))
    }
    res.status(200).json({ status: "success", data: user })
  }
)
export const getMySubscription = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userSubscription = await getUserSubscriptionPlan({
      userId: req.body.userId,
    })
    if (!userSubscription) {
      return next(new AppError(404, "there is no subscripting for this user!"))
    }
    res.status(200).json({ status: "success", data: userSubscription })
  }
)
export const updateUserPlan = catchAsync(
  async (req: IRequestWithUser, res: Response, next: NextFunction) => {
    const customerId = req.user?.customerId
    if (!customerId) {
      throw new AppError(404, "Can't ind customer Id to update it's plan!")
    }
    const subscription = await getUserSubscriptionPlan({
      userId: req.user?.id as string,
    })

    if (!subscription) {
      return next(
        new AppError(404, "The user is not subscribed to plan to upgrade it !")
      )
    }
    const portal = await createStripeBillingPortal(customerId)
    res.status(200).json({
      status: "success",
      data: portal,
      message: "redirect to the portal to change the plan from it!",
    })
  }
)
export const getMyHistorySessions = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const sessions = await getUserAllDoneSessionsService({
      userId: req.body.userId,
    })
    res
      .status(200)
      .json({ status: "success", length: sessions.length, data: sessions })
  }
)
export const getUpcomingSessions = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const sessions = await getUserUpcomingSessionsService({
      userId: req.body.userId,
    })
    res
      .status(200)
      .json({ status: "success", length: sessions.length, data: sessions })
  }
)
export const getUserSessions = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    let page = req.query.page
    let limit = req.query.limit
    let nPage
    let nLimit
    let offset
    if (page && limit) {
      nPage = Number(page)
      nLimit = Number(limit)
    }
    const sessions = await getUserAllSessionsService({
      userId: req.body.userId,
      page: nPage,
      pageSize: nLimit,
    })
    res
      .status(200)
      .json({ status: "success", length: sessions.length, data: sessions })
  }
)
export const getMySessionRescheduleRequests = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.body.userId
    const rescheduleRequests = await getUserRescheduleRequests({ userId })
    res.status(200).json({
      status: "success",
      length: rescheduleRequests.length,
      data: rescheduleRequests,
    })
  }
)
export const checkJWT = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const token = req.query.token
    const decoded = (await verifyToken(token as string)) as decodedToken
    const user = await getUserByIdService({ userId: decoded.id })
    res.status(200).json({
      status: "success",
      message: "The token is verified!",
      userName: user?.name,
    })
  }
)
