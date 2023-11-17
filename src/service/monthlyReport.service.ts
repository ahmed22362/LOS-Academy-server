import MonthlyReport from "../db/models/monthlyReport.model"
import { GradeOptions } from "../db/models/report.model"
import AppError from "../utils/AppError"
import {
  createModelService,
  deleteModelService,
  getAllModelsByService,
  getModelByIdService,
  getModelsService,
  updateModelService,
} from "./factory.services"

interface createMonthlyReportBody {
  userId: string
  arabicToPage?: number
  arabicGrade?: GradeOptions
  quranToPage?: number
  quranGrade?: GradeOptions
  islamicToPage?: number
  islamicGrade?: GradeOptions
  comment?: string
}
export async function createMonthlyReportService({
  body,
}: {
  body: createMonthlyReportBody
}) {
  try {
    const monthlyReport = await createModelService({
      ModelClass: MonthlyReport,
      data: body,
    })
    if (!monthlyReport) {
      throw new AppError(400, "Can't Create monthlyReport!")
    }
    return monthlyReport
  } catch (error: any) {
    throw new AppError(
      400,
      `Error While creating product or monthlyReport!: ${error.message}`
    )
  }
}
export async function getAllMonthlyReportsService({
  page,
  limit,
}: {
  page?: number
  limit?: number
}) {
  try {
    const monthlyReports = await getModelsService({
      ModelClass: MonthlyReport,
      page,
      limit,
    })
    if (!monthlyReports) {
      throw new AppError(400, `Error while retrieving monthlyReport`)
    }
    return monthlyReports
  } catch (error: any) {
    throw new AppError(
      400,
      `Error while retrieving monthlyReport: ${error.message}`
    )
  }
}
export async function updateMonthlyReportService({
  id,
  updatedData,
}: {
  id: number
  updatedData: any
}) {
  return (await updateModelService({
    ModelClass: MonthlyReport,
    id,
    updatedData,
  })) as MonthlyReport
}
export async function deleteMonthlyReportService({ id }: { id: number }) {
  return await deleteModelService({ ModelClass: MonthlyReport, id: id })
}
export async function getMonthlyReportService({ id }: { id: number }) {
  return (await getModelByIdService({
    ModelClass: MonthlyReport,
    Id: id,
  })) as MonthlyReport
}
export async function getUserMonthlyReportService({
  userId,
  pageSize,
  page,
}: {
  userId: string
  pageSize?: number
  page?: number
}) {
  const reports = await getAllModelsByService({
    Model: MonthlyReport,
    findOptions: { where: { userId } },
    page,
    pageSize,
  })
  return reports as MonthlyReport[]
}
