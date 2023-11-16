import { FindOptions, Op } from "sequelize"
import sessionReport, { GradeOptions } from "../db/models/report.model"
import AppError from "../utils/AppError"
import { updateModelService } from "./factory.services"
import { getSessionInfosSessions } from "./session.service"
import {
  getTeacherSessionInfoService,
  getUserSessionInfoService,
} from "./sessionInfo.service"
import Session from "../db/models/session.model"
import SessionInfo from "../db/models/sessionInfo.model"
interface IReportBody {
  title: string
  arabic?: string
  quran?: string
  islamic?: string
  comment?: string
  grade: GradeOptions
  sessionId: number
}

export async function createReportService({ body }: { body: IReportBody }) {
  try {
    const report = await sessionReport.create(body as any)
    if (!report) {
      throw new AppError(400, "Can't create report")
    }
    return report
  } catch (error: any) {
    throw new AppError(400, `Error Creating report: ${error.message}`)
  }
}
export async function getReportService({
  reportId,
  findOptions,
}: {
  reportId: number
  findOptions?: FindOptions
}) {
  try {
    const report = await sessionReport.findByPk(reportId, findOptions)
    if (!report) {
      throw new AppError(404, "Can't find report with this id!")
    }
    return report
  } catch (error: any) {
    throw new AppError(404, `Error Getting report: ${error.message}`)
  }
}
export async function updateReportService({
  reportId,
  updateBody,
}: {
  reportId: number
  updateBody: Partial<IReportBody>
}) {
  const report = updateModelService({
    ModelClass: sessionReport,
    id: reportId,
    updatedData: updateBody,
  })
  return report
}
export async function deleteReportService({ reportId }: { reportId: number }) {
  const report = await sessionReport.destroy({ where: { id: reportId } })
}
export async function getSessionReportService({
  sessionId,
}: {
  sessionId: number
}) {
  const report = await sessionReport.findOne({ where: { sessionId } })
  if (!report) {
    throw new AppError(404, "there is no report for this session!")
  }
  return report
}
export async function getUserOrTeacherReportsService({
  userId,
  teacherId,
  page,
  pageSize,
}: {
  userId?: string
  teacherId?: string
  page?: number
  pageSize?: number
}) {
  let sessionInfos: SessionInfo[]
  if (userId) {
    sessionInfos = await getUserSessionInfoService({ userId })
  } else if (teacherId) {
    sessionInfos = await getTeacherSessionInfoService({
      teacherId,
    })
  } else {
    throw new AppError(404, "please provide user or teacher id")
  }
  const sessionInfoIds = sessionInfos.map((si) => si.id)
  const sessions = await getSessionInfosSessions(sessionInfoIds)
  const reportIds = sessions.map((s) => s.id)
  let limit
  let offset
  if (pageSize) limit = pageSize
  if (page && pageSize) offset = page * pageSize
  const reports = await sessionReport.findAll({
    where: {
      id: {
        [Op.in]: reportIds,
      },
    },
    include: { model: Session, attributes: ["sessionDate"] },
    limit,
    offset,
  })
  return reports
}
export async function getAllReportsService({
  findOptions,
}: {
  findOptions?: FindOptions
}) {
  const reports = await sessionReport.findAll(findOptions)
  return reports
}
