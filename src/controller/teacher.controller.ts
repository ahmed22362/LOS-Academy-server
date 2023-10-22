import { NextFunction, Request, Response } from "express"
import catchAsync from "../utils/catchAsync"
import {
  createTeacherService,
  deleteTeacherService,
  getTeacherByIdService,
  getTeachersService,
  updateTeacherService,
} from "../service/teacher.service"
import AppError from "../utils/AppError"
import Teacher, { ITeacherInput } from "../db/models/teacher.model"
import { login, protect } from "./auth.controller"

const getTeacherAtt = ["id", "fName", "lName", "phone", "email", "role"]

export const createTeacher = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { fName, lName, email, password, phone, nationalId, role } = req.body
    const body = {
      fName,
      lName,
      email,
      password,
      phone,
      nationalId,
      role,
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
    const teachers = await getTeachersService({
      findOptions: { attributes: getTeacherAtt },
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
    const { fName, lName, email, phone, nationalId, role } = req.body
    const body = {
      fName,
      lName,
      email,
      phone,
      nationalId,
      role,
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
export const loginTeacher = login(Teacher)

export const protectTeacher = protect(Teacher)
