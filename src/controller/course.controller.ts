import { NextFunction, Request, Response } from "express"
import catchAsync from "../utils/catchAsync"
import {
  createCourseService,
  deleteCourseService,
  getAllCoursesService,
  getCourseService,
  updateCourseService,
} from "../service/course.service"
import {
  deleteStripeProduct,
  updateStripeProduct,
} from "../service/stripe.service"

export const createCourse = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { title, description } = req.body
    const course = await createCourseService({ body: { title, description } })
    res.status(201).json({
      status: "success",
      message: "course created successfully!",
      data: course,
    })
  }
)
export const getAllCourses = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    let page = req.query.page
    let limit = req.query.limit
    let nPage
    let nLimit
    if (page && limit) {
      nPage = Number(page)
      nLimit = Number(limit)
    }
    const courses = await getAllCoursesService({ page: nPage, limit: nLimit })
    res
      .status(200)
      .json({ status: "success", length: courses.length, data: courses })
  }
)

export const getCourse = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id
    const course = await getCourseService({ id })
    res.status(200).json({ status: "success", data: course })
  }
)
export const updateCourse = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id
    const { title, description } = req.body
    const course = await updateCourseService({
      id,
      updatedData: { title, description },
    })
    await updateStripeProduct({
      productId: course.stripeProductId,
      body: { name: title },
    })
    res.status(200).json({ status: "success", data: course })
  }
)

export const deleteCourse = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id
    const course = await getCourseService({ id })
    await deleteCourseService({
      id: course?.id,
    })
    await deleteStripeProduct({
      productId: course.stripeProductId,
    })
    res.status(200).json({ status: "success", data: course })
  }
)
