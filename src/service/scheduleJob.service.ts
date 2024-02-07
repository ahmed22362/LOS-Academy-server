import {
  DestroyOptions,
  FindOptions,
  Transaction,
  UpdateOptions,
} from "sequelize";
import Job, { scheduledJobStatus } from "../db/models/scheduleJob.model";
import AppError from "../utils/AppError";
import {
  deleteModelService,
  getModelByIdService,
  updateModelService,
} from "./factory.services";
import logger from "../utils/logger";
import { Op } from "sequelize";

export interface createJobBody {
  name: string;
  sessionId: number;
  scheduledTime: Date;
  callbackName: string;
  status?: scheduledJobStatus;
  data?: object;
}
export async function createJobService({
  body,
  transaction,
}: {
  body: createJobBody;
  transaction?: Transaction;
}) {
  try {
    const job = await Job.create(body as any, { transaction });
    if (!job) {
      throw new AppError(400, "Can't Create job!");
    }
    return job;
  } catch (error: any) {
    throw new AppError(400, `Error While creating  job!: ${error.message}`);
  }
}
export async function getAllJobsService({
  findOptions,
}: {
  findOptions?: FindOptions;
}) {
  try {
    const jobs = await Job.findAll(findOptions);
    if (!jobs) {
      logger.error("Can't find jobs");
    }
    return jobs;
  } catch (error: any) {
    logger.error(`Error while retrieving job: ${error.message}`);
  }
}
export async function updateJobService({
  id,
  updatedData,
}: {
  id: string | number;
  updatedData: any;
}) {
  return (await updateModelService({
    ModelClass: Job,
    id,
    updatedData,
  })) as Job;
}
export async function updateJobServiceBy({
  value,
  updateOptions,
}: {
  value: object;
  updateOptions: UpdateOptions;
}) {
  await Job.update(value, updateOptions);
}
export async function deleteJobService({ id }: { id: number }) {
  const job = await getJobService({ id });
  if (job) await deleteModelService({ ModelClass: Job, id: id });
}
export async function deleteJobServiceWhere({
  destroyOption,
}: {
  destroyOption: DestroyOptions;
}) {
  await Job.destroy(destroyOption);
}
export async function deleteFailedJobService() {
  await deleteJobServiceWhere({
    destroyOption: {
      where: {
        [Op.or]: [
          { status: scheduledJobStatus.FAILED },
          { scheduledTime: { [Op.lt]: new Date() } },
        ],
      },
    },
  });
}

export async function getJobService({ id }: { id: number }) {
  return (await getModelByIdService({ ModelClass: Job, Id: id })) as Job;
}
export async function getJobServiceByName({ jobName }: { jobName: string }) {
  const job = await Job.findOne({ where: { name: jobName } });
  if (!job) {
    throw new AppError(404, `There is no job with this name ${jobName}`);
  }
  return job;
}
