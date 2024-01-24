import {
  FindOptions,
  IncludeOptions,
  Transaction,
  WhereOptions,
} from "sequelize";
import sessionReport, {
  GradeOptions,
  ReportsCourses,
} from "../db/models/report.model";
import AppError from "../utils/AppError";
import { updateModelService } from "./factory.services";
import User from "../db/models/user.model";
import Teacher from "../db/models/teacher.model";
import { getUserAttr } from "../controller/user.controller";
import { getTeacherAtt } from "../controller/teacher.controller";
interface IReportBody {
  reportCourses: ReportsCourses;
  comment?: string;
  grade: GradeOptions;
  teacherId: string;
  userId: string;
  title: string;
}

export async function createReportService({
  body,
  transaction,
}: {
  body: IReportBody;
  transaction?: Transaction;
}) {
  try {
    const report = await sessionReport.create(body as any, { transaction });
    if (!report) {
      throw new AppError(400, "Can't create report");
    }
    return report;
  } catch (error: any) {
    throw new AppError(400, `Error Creating report: ${error.message}`);
  }
}
export async function getReportService({
  reportId,
  findOptions,
}: {
  reportId: number;
  findOptions?: FindOptions;
}) {
  try {
    const report = await sessionReport.findByPk(reportId, findOptions);
    if (!report) {
      throw new AppError(404, "Can't find report with this id!");
    }
    return report;
  } catch (error: any) {
    throw new AppError(404, `Error Getting report: ${error.message}`);
  }
}
export async function updateReportService({
  reportId,
  updateBody,
}: {
  reportId: number;
  updateBody: Partial<IReportBody>;
}) {
  const report = updateModelService({
    ModelClass: sessionReport,
    id: reportId,
    updatedData: updateBody,
  });
  return report;
}
export async function deleteReportService({ reportId }: { reportId: number }) {
  const report = await sessionReport.destroy({ where: { id: reportId } });
}
export async function getSessionReportService({
  sessionId,
}: {
  sessionId: number;
}) {
  const report = await sessionReport.findOne({ where: { sessionId } });
  if (!report) {
    throw new AppError(404, "there is no report for this session!");
  }
  return report;
}
export async function getUserOrTeacherReportsService({
  userId,
  teacherId,
  limit,
  offset,
}: {
  userId?: string;
  teacherId?: string;
  limit?: number;
  offset?: number;
}) {
  let where: WhereOptions = {};
  if (userId) {
    where.userId = userId;
  } else if (teacherId) {
    where.teacherId = teacherId;
  }
  const reports = await sessionReport.findAll({
    where,
    limit,
    offset: offset ?? 0,
    include: [
      {
        model: userId ? Teacher : User,
        attributes: userId ? getTeacherAtt : getUserAttr,
      },
    ],
  });
  return reports;
}
export async function getAllReportsService({
  findOptions,
}: {
  findOptions?: FindOptions;
}) {
  const reports = await sessionReport.findAll(findOptions);
  return reports;
}
