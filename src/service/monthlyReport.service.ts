import { getTeacherAtt } from "../controller/teacher.controller";
import {
  getPaginationParameter,
  getUserAttr,
} from "../controller/user.controller";
import MonthlyReport from "../db/models/monthlyReport.model";
import { GradeOptions, ReportsCourses } from "../db/models/report.model";
import Teacher from "../db/models/teacher.model";
import User from "../db/models/user.model";
import AppError from "../utils/AppError";
import {
  createModelService,
  deleteModelService,
  getAllModelsByService,
  getModelByIdService,
  getModelsService,
  updateModelService,
} from "./factory.services";

interface createMonthlyReportBody {
  reportCourses: ReportsCourses;
  comment?: string;
  grade: GradeOptions;
  userId: string;
  teacherId: string;
}
export async function createMonthlyReportService({
  body,
}: {
  body: createMonthlyReportBody;
}) {
  try {
    const monthlyReport = await createModelService({
      ModelClass: MonthlyReport,
      data: body,
    });
    if (!monthlyReport) {
      throw new AppError(400, "Can't Create monthlyReport!");
    }
    return monthlyReport;
  } catch (error: any) {
    throw new AppError(
      400,
      `Error While creating monthlyReport!: ${error.message}`,
    );
  }
}
export async function getAllMonthlyReportsService({
  limit,
  offset,
}: {
  limit?: number;
  offset?: number;
}): Promise<{
  rows: MonthlyReport[];
  count: number;
}> {
  try {
    const monthlyReports = await MonthlyReport.findAndCountAll({
      limit,
      offset,
      include: [
        { model: User, attributes: getUserAttr },
        { model: Teacher, attributes: getTeacherAtt },
      ],
    });
    if (!monthlyReports) {
      throw new AppError(400, `Error while retrieving monthlyReport`);
    }
    return monthlyReports;
  } catch (error: any) {
    throw new AppError(
      400,
      `Error while retrieving monthlyReport: ${error.message}`,
    );
  }
}
export async function updateMonthlyReportService({
  id,
  updatedData,
}: {
  id: number;
  updatedData: any;
}) {
  return (await updateModelService({
    ModelClass: MonthlyReport,
    id,
    updatedData,
  })) as MonthlyReport;
}
export async function deleteMonthlyReportService({ id }: { id: number }) {
  return await deleteModelService({ ModelClass: MonthlyReport, id: id });
}
export async function getMonthlyReportService({ id }: { id: number }) {
  const report = await MonthlyReport.findByPk(id, {
    include: [
      { model: User, attributes: getUserAttr },
      { model: Teacher, attributes: getTeacherAtt },
    ],
  });
  return report;
}
export async function getUserMonthlyReportService({
  userId,
  limit,
  offset,
}: {
  userId: string;
  limit?: number;
  offset?: number;
}) {
  const reports = await getAllModelsByService({
    Model: MonthlyReport,
    findOptions: {
      where: { userId },
      include: [
        { model: User, attributes: getUserAttr },
        { model: Teacher, attributes: getTeacherAtt },
      ],
    },
    limit,
    offset,
  });
  return reports as MonthlyReport[];
}
export async function getTeacherMonthlyReportService({
  teacherId,
  limit,
  offset,
}: {
  teacherId: string;
  limit?: number;
  offset?: number;
}) {
  const reports = await getAllModelsByService({
    Model: MonthlyReport,
    findOptions: {
      where: { teacherId },
      include: [
        { model: User, attributes: getUserAttr },
        { model: Teacher, attributes: getTeacherAtt },
      ],
    },
    limit,
    offset,
  });
  return reports as MonthlyReport[];
}
