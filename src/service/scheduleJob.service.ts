import { FindOptions, WhereOptions } from "sequelize"
import Job, { scheduledJobStatus } from "../db/models/scheduleJob.model"
import AppError from "../utils/AppError"
import {
  createModelService,
  deleteModelService,
  getModelByIdService,
  getModelsService,
  updateModelService,
} from "./factory.services"

export interface createJobBody {
  name: string
  scheduledTime: Date
  callbackName: string
  status?: scheduledJobStatus
  data?: object
}
export async function createJobService({ body }: { body: createJobBody }) {
  try {
    const job = await createModelService({ ModelClass: Job, data: body })
    if (!job) {
      throw new AppError(400, "Can't Create job!")
    }
    return job
  } catch (error: any) {
    throw new AppError(400, `Error While creating  job!: ${error.message}`)
  }
}
export async function getAllJobsService({
  page,
  limit,
  findOptions,
}: {
  page?: number
  limit?: number
  findOptions?: FindOptions
}) {
  try {
    const jobs = await getModelsService({
      ModelClass: Job,
      findOptions,
      page,
      limit,
    })
    if (!jobs) {
      throw new AppError(400, `Error while retrieving job`)
    }
    return jobs as Job[]
  } catch (error: any) {
    throw new AppError(400, `Error while retrieving job: ${error.message}`)
  }
}
export async function updateJobService({
  id,
  updatedData,
}: {
  id: string | number
  updatedData: any
}) {
  return (await updateModelService({
    ModelClass: Job,
    id,
    updatedData,
  })) as Job
}
export async function deleteJobService({ id }: { id: number }) {
  return await deleteModelService({ ModelClass: Job, id: id })
}
export async function getJobService({ id }: { id: number }) {
  return (await getModelByIdService({ ModelClass: Job, Id: id })) as Job
}
