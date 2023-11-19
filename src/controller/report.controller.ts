import { NextFunction, Response, Request } from "express"
import catchAsync from "../utils/catchAsync"
import {
  getOneSessionDetailsService,
  teacherOwnThisSession,
} from "../service/session.service"
import AppError from "../utils/AppError"
import {
  createReportService,
  deleteReportService,
  getAllReportsService,
  getReportService,
  getUserOrTeacherReportsService,
  updateReportService,
} from "../service/report.service"
import Session, { SessionStatus } from "../db/models/session.model"

export const createReport = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const {
      sessionId,
      arabic,
      islamic,
      quran,
      arabicComment,
      islamicComment,
      quranComment,
      comment,
      teacherId,
      grade,
      title,
    } = req.body
    const exist = await teacherOwnThisSession({ teacherId, sessionId })
    if (!exist) {
      next(
        new AppError(
          401,
          "Teacher does not own this session to write report for it"
        )
      )
    }
    const session = await getOneSessionDetailsService({ sessionId })
    if (session.status !== SessionStatus.TAKEN) {
      return next(new AppError(400, "can't add report to a non taken session"))
    }

    const report = await createReportService({
      body: {
        arabic,
        islamic,
        quran,
        comment,
        grade,
        sessionId,
        title,
        arabicComment,
        islamicComment,
        quranComment,
      },
    })
    res.status(201).json({
      status: "success",
      message: "report created successfully",
      data: report,
    })
  }
)
export const updateReport = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { arabic, islamic, quran, comment, teacherId, grade, title } =
      req.body
    const reportId = req.params.id
    const report = await getReportService({
      reportId: +reportId,
      findOptions: { include: Session },
    })
    const exist = await teacherOwnThisSession({
      teacherId,
      sessionId: report.session.id,
    })
    if (!exist) {
      next(
        new AppError(
          401,
          "Teacher does not own this session to write report for it"
        )
      )
    }
    const updatedReport = await updateReportService({
      reportId: report.id,
      updateBody: { arabic, islamic, quran, comment, grade, title },
    })
    res.status(200).json({
      status: "success",
      message: "report updated successfully",
      data: updatedReport,
    })
  }
)
export const getReport = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const reportId = req.params.id
    const report = await getReportService({ reportId: +reportId })
    res.status(200).json({ status: "success", data: report })
  }
)
export const deleteReport = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const reportId = req.params.id
    const teacherId = req.body.teacherId
    const report = await getReportService({
      reportId: +reportId,
      findOptions: { include: Session },
    })
    const exist = await teacherOwnThisSession({
      teacherId,
      sessionId: report.session.id,
    })
    if (!exist) {
      next(
        new AppError(
          401,
          "Teacher does not own this session to write report for it"
        )
      )
    }
    await deleteReportService({ reportId: +reportId })
    res
      .status(200)
      .json({ status: "success", message: "report deleted successfully" })
  }
)
export const getAllReports = catchAsync(
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
    const reports = await getAllReportsService({
      findOptions: {
        include: { model: Session, attributes: ["sessionDate"] },
        limit: nLimit,
        offset: offset,
      },
    })
    res
      .status(200)
      .json({ status: "success", length: reports.length, data: reports })
  }
)
export const getUserReports = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    let page = req.query.page
    let limit = req.query.limit
    let nPage
    let nLimit
    if (page && limit) {
      nPage = Number(page)
      nLimit = Number(limit)
    }
    const userId = req.query.userId || req.body.userId
    const reports = await getUserOrTeacherReportsService({
      userId,
      page: nPage,
      pageSize: nLimit,
    })
    res
      .status(200)
      .json({ status: "success", length: reports.length, data: reports })
  }
)
export const getTeacherReports = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    let page = req.query.page
    let limit = req.query.limit
    let nPage
    let nLimit
    if (page && limit) {
      nPage = Number(page)
      nLimit = Number(limit)
    }
    const teacherId = req.query.teacherId || req.body.teacherId
    const reports = await getUserOrTeacherReportsService({
      teacherId,
      page: nPage,
      pageSize: nLimit,
    })
    res
      .status(200)
      .json({ status: "success", length: reports.length, data: reports })
  }
)
