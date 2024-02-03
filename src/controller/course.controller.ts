import { NextFunction, Request, Response } from "express";
import catchAsync from "../utils/catchAsync";
import {
  createCourseBody,
  createCourseService,
  deleteCourseService,
  getAllCoursesService,
  getCourseService,
  updateCourseService,
} from "../service/course.service";
import AppError from "../utils/AppError";
import { getPaginationParameter } from "./user.controller";

export const createCourse = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { title, description, details } = req.body;
    const body: createCourseBody = { title, description, details };
    const course = await createCourseService({
      body,
    });
    res.status(201).json({
      status: "success",
      message: "course created successfully!",
      data: course,
    });
  },
);
export const getAllCourses = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { nLimit, offset } = getPaginationParameter(req);
    const courses = await getAllCoursesService({ offset, limit: nLimit });
    res.status(200).json({
      status: "success",
      length: courses.count,
      data: courses.rows,
    });
  },
);
export const getCourse = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;
    const course = await getCourseService({ id });
    if (!course) {
      return next(new AppError(404, "Can't find course with this id!"));
    }
    res.status(200).json({ status: "success", data: course });
  },
);
export const updateCourse = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;
    const { title, description, details } = req.body;
    const course = await updateCourseService({
      id,
      updatedData: { title, description, details },
    });
    res.status(200).json({ status: "success", data: course });
  },
);
export const deleteCourse = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;
    const course = await getCourseService({ id });
    await deleteCourseService({
      id: course?.id,
    });
    res
      .status(200)
      .json({ status: "success", message: "course deleted successfully" });
  },
);
