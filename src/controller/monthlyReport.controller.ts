import { NextFunction, Request, Response } from "express"
import catchAsync from "../utils/catchAsync"
import {
  createMonthlyReportService,
  deleteMonthlyReportService,
  getAllMonthlyReportsService,
  getMonthlyReportService,
  getUserMonthlyReportService,
  updateMonthlyReportService,
} from "../service/monthlyReport.service"
import AppError from "../utils/AppError"

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
    } = req.body
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
    })
    res.status(201).json({
      status: "success",
      message: "monthlyReport created successfully!",
      data: monthlyReportInstance,
    })
  }
)
export const getAllMonthlyReports = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    let page = req.query.page
    let limit = req.query.limit
    let nPage
    let nLimit
    if (page && limit) {
      nPage = Number(page)
      nLimit = Number(limit)
    }
    const monthlyReports = await getAllMonthlyReportsService({
      page: nPage,
      limit: nLimit,
    })
    res.status(200).json({
      status: "success",
      length: monthlyReports.length,
      data: monthlyReports,
    })
  }
)
export const getMonthlyReport = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id
    const monthlyReport = await getMonthlyReportService({ id: +id })
    if (!monthlyReport) {
      return next(new AppError(404, "there is no report with this id!"))
    }
    res.status(200).json({ status: "success", data: monthlyReport })
  }
)
export const updateMonthlyReport = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id
    const {
      arabicToPage,
      arabicGrade,
      quranToPage,
      quranGrade,
      islamicToPage,
      islamicGrade,
      comment,
    } = req.body
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
    })
    res.status(200).json({ status: "success", data: monthlyReportInstance })
  }
)
export const deleteMonthlyReport = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id
    const monthlyReport = await getMonthlyReportService({ id: +id })
    await deleteMonthlyReportService({
      id: monthlyReport?.id,
    })
    res.status(200).json({
      status: "success",
      message: "monthlyReport deleted successfully",
    })
  }
)
export const getUserMonthlyReport = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.body
    const reports = await getUserMonthlyReportService({ userId })
    res
      .status(200)
      .json({ status: "success", length: reports.length, data: reports })
  }
)
