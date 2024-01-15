import { NextFunction, Request, Response } from "express";
import catchAsync from "../utils/catchAsync";
import {
  createMonthlyReportService,
  deleteMonthlyReportService,
  getAllMonthlyReportsService,
  getMonthlyReportService,
  getUserMonthlyReportService,
  updateMonthlyReportService,
} from "../service/monthlyReport.service";
import AppError from "../utils/AppError";
import { getTeacherStudentsService } from "../service/teacher.service";
import { getPaginationParameter } from "./user.controller";
import { estimateRowCount } from "../utils/getTableRowCount";
import { MONTHLY_REPORT_TABLE_NAME } from "../db/models/monthlyReport.model";

export const createMonthlyReport = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const {
      userId,
      arabicToPage,
      arabicGrade,
      quranToPage,
      quranGrade,
      islamicToPage,
      islamicGrade,
      comment,
    } = req.body;
    const monthlyReportInstance = await createMonthlyReportService({
      body: {
        userId,
        arabicGrade,
        arabicToPage,
        quranGrade,
        quranToPage,
        islamicGrade,
        islamicToPage,
        comment,
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
    const { nLimit, nPage } = getPaginationParameter(req);
    const monthlyReports = await getAllMonthlyReportsService({
      page: nPage,
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
    const {
      arabicToPage,
      arabicGrade,
      quranToPage,
      quranGrade,
      islamicToPage,
      islamicGrade,
      comment,
    } = req.body;
    const monthlyReportInstance = await updateMonthlyReportService({
      id: +id,
      updatedData: {
        arabicGrade,
        arabicToPage,
        quranGrade,
        quranToPage,
        islamicGrade,
        islamicToPage,
        comment,
      },
    });
    res.status(200).json({ status: "success", data: monthlyReportInstance });
  },
);
export const deleteMonthlyReport = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;
    const monthlyReport = await getMonthlyReportService({ id: +id });
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
    const reports = await getUserMonthlyReportService({ userId });
    res
      .status(200)
      .json({ status: "success", length: reports.length, data: reports });
  },
);

export const getTeacherMonthlyReport = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { teacherId } = req.body;
    const reports = [];
    const students = await getTeacherStudentsService({ teacherId });
    for (const student of students) {
      const userReport = await getUserMonthlyReportService({
        userId: student.id,
      });
      reports.push(...userReport);
    }
    res.status(200).json({ status: "success", data: reports });
  },
);
