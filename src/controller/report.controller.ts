import { NextFunction, Response, Request } from "express";
import catchAsync from "../utils/catchAsync";
import {
  getOneSessionWithSessionInfoOnlyService,
  teacherOwnThisSession,
  updateSessionService,
} from "../service/session.service";
import AppError from "../utils/AppError";
import {
  createReportService,
  deleteReportService,
  getAllReportsService,
  getReportService,
  getUserOrTeacherReportsService,
  updateReportService,
} from "../service/report.service";
import Session, {
  SessionStatus,
  SessionType,
} from "../db/models/session.model";
import User from "../db/models/user.model";
import { getPaginationParameter, getUserAttr } from "./user.controller";
import Teacher from "../db/models/teacher.model";
import { getTeacherAtt } from "./teacher.controller";
import logger from "../utils/logger";
import { updateTeacherBalance } from "../service/teacher.service";
import { sequelize } from "../db/sequelize";
import { emitReportAddedForUser } from "../connect/socket";

export const createReport = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { sessionId, reportCourses, comment, teacherId, grade, title } =
      req.body;
    const exist = await teacherOwnThisSession({ teacherId, sessionId });
    if (!exist) {
      next(
        new AppError(
          401,
          "Teacher does not own this session to write report for it",
        ),
      );
    }
    const session = await getOneSessionWithSessionInfoOnlyService({
      sessionId,
    });
    if (session.status !== SessionStatus.TAKEN) {
      return next(new AppError(400, "can't add report to a non taken session"));
    }
    if (session.hasReport) {
      return next(
        new AppError(
          400,
          "Session already has report you can't add two reports for the same session!",
        ),
      );
    }
    const transaction = await sequelize.transaction();
    try {
      const report = await createReportService({
        body: {
          reportCourses,
          comment,
          grade,
          teacherId,
          userId: session.SessionInfo.userId!,
          title,
        },
        transaction,
      });
      if (session.type === SessionType.PAID) {
        await updateTeacherBalance({
          teacherId: teacherId!,
          mins: session.sessionDuration,
          transaction,
        });
      }
      await updateSessionService({
        sessionId,
        updatedData: { hasReport: true },
        transaction,
      });
      await transaction.commit();
      emitReportAddedForUser(session.SessionInfo.userId!, report);
      res.status(201).json({
        status: "success",
        message: "report created successfully",
        data: report,
      });
    } catch (error: any) {
      await transaction.rollback();
      logger.error(`Error while creating report ${error}`);
      return next(new AppError(400, `Error creating report ${error.message}`));
    }
  },
);
export const updateReport = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { reportCourses, comment, teacherId, grade } = req.body;
    const reportId = req.params.id;
    const report = await getReportService({
      reportId: +reportId,
      findOptions: { where: { teacherId } },
    });
    if (!report) {
      return next(
        new AppError(403, "there are no report with this id and teacher!"),
      );
    }
    const updatedReport = await updateReportService({
      reportId: report.id,
      updateBody: {
        reportCourses,
        comment,
        grade,
      },
    });
    res.status(200).json({
      status: "success",
      message: "report updated successfully",
      data: updatedReport,
    });
  },
);
export const getReport = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const reportId = req.params.id;
    const report = await getReportService({ reportId: +reportId });
    res.status(200).json({ status: "success", data: report });
  },
);
export const deleteReport = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const reportId = req.params.id;
    const report = await getReportService({
      reportId: +reportId,
    });

    await deleteReportService({ reportId: +reportId });
    res
      .status(200)
      .json({ status: "success", message: "report deleted successfully" });
  },
);
export const getAllReports = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { offset, nLimit } = getPaginationParameter(req);

    const reports = await getAllReportsService({
      findOptions: {
        include: [
          { model: User, attributes: getUserAttr },
          { model: Teacher, attributes: getTeacherAtt },
        ],
        limit: nLimit,
        offset: offset,
      },
    });
    res.status(200).json({
      status: "success",
      length: reports.count,
      data: reports.rows,
    });
  },
);
export const getUserReports = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { offset, nLimit } = getPaginationParameter(req);
    const userId = req.query.userId || req.body.userId;
    const reports = await getUserOrTeacherReportsService({
      userId,
      offset,
      limit: nLimit,
    });
    res
      .status(200)
      .json({ status: "success", length: reports.length, data: reports });
  },
);
export const getTeacherReports = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { offset, nLimit } = getPaginationParameter(req);
    const teacherId = req.query.teacherId || req.body.teacherId;
    const reports = await getUserOrTeacherReportsService({
      teacherId,
      offset: offset,
      limit: nLimit,
    });
    res
      .status(200)
      .json({ status: "success", length: reports.length, data: reports });
  },
);
