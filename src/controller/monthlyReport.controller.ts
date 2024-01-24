import { NextFunction, Request, Response } from "express";
import catchAsync from "../utils/catchAsync";
import {
  createMonthlyReportService,
  deleteMonthlyReportService,
  getAllMonthlyReportsService,
  getMonthlyReportService,
  getTeacherMonthlyReportService,
  getUserMonthlyReportService,
  updateMonthlyReportService,
} from "../service/monthlyReport.service";
import AppError from "../utils/AppError";
import {
  getTeacherByIdService,
  getTeacherStudentsService,
} from "../service/teacher.service";
import { getPaginationParameter } from "./user.controller";
import { estimateRowCount } from "../utils/getTableRowCount";
import { MONTHLY_REPORT_TABLE_NAME } from "../db/models/monthlyReport.model";
import { RoleType } from "../db/models/teacher.model";

export const createMonthlyReport = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId, reportCourses, comment, teacherId, grade } = req.body;
    const monthlyReportInstance = await createMonthlyReportService({
      body: {
        userId,
        reportCourses,
        comment,
        grade,
        teacherId,
      },
    });
    res.status(201).json({
      status: "success",
      message: "monthlyReport created successfully!",
      data: monthlyReportInstance,
    });
  },
);
export const getAllMonthlyReports = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { nLimit, offset } = getPaginationParameter(req);
    const monthlyReports = await getAllMonthlyReportsService({
      offset,
      limit: nLimit,
    });
    res.status(200).json({
      status: "success",
      length: await estimateRowCount(MONTHLY_REPORT_TABLE_NAME),
      data: monthlyReports,
    });
  },
);
export const getMonthlyReport = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;
    const monthlyReport = await getMonthlyReportService({ id: +id });
    if (!monthlyReport) {
      return next(new AppError(404, "there is no report with this id!"));
    }
    res.status(200).json({ status: "success", data: monthlyReport });
  },
);
export const updateMonthlyReport = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;
    const { reportCourses, comment, teacherId, grade } = req.body;
    const report = await getMonthlyReportService({ id: +id });
    if (!report) {
      throw new AppError(404, "there is no report with this id!");
    }
    const teacher = await getTeacherByIdService({ id: teacherId });
    if (report.teacherId !== teacherId && teacher.role !== RoleType.ADMIN) {
      throw new AppError(403, "you don't own this report to update!");
    }
    const monthlyReportInstance = await updateMonthlyReportService({
      id: +id,
      updatedData: {
        reportCourses,
        comment,
        grade,
      },
    });
    res.status(200).json({ status: "success", data: monthlyReportInstance });
  },
);
export const deleteMonthlyReport = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;
    const monthlyReport = await getMonthlyReportService({ id: +id });
    if (!monthlyReport) {
      throw new AppError(404, "there is no report with this id!");
    }
    await deleteMonthlyReportService({
      id: monthlyReport?.id,
    });
    res.status(200).json({
      status: "success",
      message: "monthlyReport deleted successfully",
    });
  },
);
export const getUserMonthlyReport = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.body;
    const { nLimit, offset } = getPaginationParameter(req);
    const reports = await getUserMonthlyReportService({
      userId,
      limit: nLimit,
      offset,
    });
    res
      .status(200)
      .json({ status: "success", length: reports.length, data: reports });
  },
);
export const getTeacherMonthlyReport = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { teacherId } = req.body;
    const { offset, nLimit } = getPaginationParameter(req);
    const reports = await getTeacherMonthlyReportService({
      teacherId,
      limit: nLimit,
      offset,
    });
    res.status(200).json({ status: "success", data: reports });
  },
);
