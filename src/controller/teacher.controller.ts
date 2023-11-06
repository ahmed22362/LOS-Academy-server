import { NextFunction, Request, Response } from "express"
import catchAsync from "../utils/catchAsync"
import {
  createTeacherService,
  deleteTeacherService,
  getTeacherByIdService,
  getTeacherStudentsService,
  getTeachersService,
  updateTeacherService,
} from "../service/teacher.service"
import AppError from "../utils/AppError"
import Teacher, { ITeacherInput } from "../db/models/teacher.model"
import { decodedToken, login, protect } from "./auth.controller"
import {
  getTeacherAllSessionsService,
  getTeacherUpcomingSessionsService,
} from "../service/session.service"
import { verifyToken } from "../utils/jwt"
import { getStripeBalance } from "../service/stripe.service"
import { getTeacherRescheduleRequests } from "../service/rescheduleReq.service"

export const getTeacherAtt = [
  "id",
  "name",
  "phone",
  "email",
  "role",
  "sessionCost",
  "committedSessions",
  "balance",
]

export const createTeacher = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { name, email, password, phone, nationalId, role, sessionCost } =
      req.body
    const body = {
      name,
      email,
      password,
      phone,
      nationalId,
      role,
      sessionCost,
    } as ITeacherInput
    const newTeacher = await createTeacherService(body)
    if (!newTeacher) {
      return next(new AppError(400, "Can't create new Teacher!"))
    }
    res.status(200).json({ status: "success", data: newTeacher })
  }
)
export const getAllTeachers = catchAsync(
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
    const teachers = await getTeachersService({
      findOptions: { attributes: getTeacherAtt, limit: nLimit, offset },
    })
    if (!teachers) {
      return next(new AppError(400, "Error getting all teachers!"))
    }
    res
      .status(200)
      .json({ status: "success", length: teachers.length, data: teachers })
  }
)
export const deleteTeacher = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id

    const deleteState = await deleteTeacherService({ id })
    if (!deleteState) {
      return next(new AppError(400, "Error Deleting Teacher!"))
    }
    res
      .status(200)
      .json({ status: "success", message: "teacher Deleted successfully" })
  }
)
export const updateTeacher = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id
    const { name, sessionCost, email, phone, nationalId, role, password } =
      req.body
    const body = {
      name,
      email,
      phone,
      nationalId,
      role,
      sessionCost,
      password,
    } as ITeacherInput
    const teacher = await updateTeacherService({
      teacherId: id,
      updatedData: body,
    })
    if (!teacher) {
      return next(
        new AppError(
          404,
          "No Data has changed the teacher is not found or entered data is wrong"
        )
      )
    }
    res.status(200).json({
      status: "success",
      message: "teacher updated successfully",
      data: teacher,
    })
  }
)
export const getTeacher = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id
    const teacher = await getTeacherByIdService({
      id,
      findOptions: {
        attributes: getTeacherAtt,
      },
    })
    if (!teacher) {
      return next(new AppError(404, "Can't find teacher with this id!"))
    }
    res.status(200).json({ status: "success", data: teacher })
  }
)
export const getTeacherUpcomingSessions = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const teacherId = req.body.teacherId
    const sessions = await getTeacherUpcomingSessionsService({ teacherId })
    res
      .status(200)
      .json({ status: "success", length: sessions.length, data: sessions })
  }
)
export const getTeacherAllSessions = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const teacherId = req.body.teacherId
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
    const sessions = await getTeacherAllSessionsService({
      teacherId,
      page: nPage,
      pageSize: nLimit,
    })
    const allSessions = Object.values(sessions).flatMap((session) => session)
    res
      .status(200)
      .json({ status: "success", length: allSessions.length, sessions })
  }
)
export const getTeacherAllStudents = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const teacherId = req.body.teacherId
    const student = await getTeacherStudentsService({ teacherId })
    res.status(200).json({ status: "success", data: student })
  }
)
export const checkJWT = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const token = req.query.token
    const decoded = (await verifyToken(token as string)) as decodedToken

    const teacher = await getTeacherByIdService({ id: decoded.id })
    res.status(200).json({
      status: "success",
      message: "The token is verified!",
      role: teacher.role,
    })
  }
)
export const getAdminBalance = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const balance = await getStripeBalance()
    res.status(200).json({ status: "success", balance: balance.available })
  }
)
export const getMySessionRescheduleRequests = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const teacherId = req.body.teacherId
    const rescheduleRequests = await getTeacherRescheduleRequests({ teacherId })
    res.status(200).json({
      status: "success",
      length: rescheduleRequests.length,
      data: rescheduleRequests,
    })
  }
)
export const loginTeacher = login(Teacher)

export const protectTeacher = protect(Teacher)
