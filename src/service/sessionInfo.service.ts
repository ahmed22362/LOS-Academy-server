import { FindOptions, IncludeOptions, Transaction } from "sequelize"
import SessionInfo from "../db/models/sessionInfo.model"
import AppError from "../utils/AppError"
import {
  createModelService,
  getAllModelsByService,
  getModelByIdService,
  getModelsService,
  getOneModelByService,
  updateModelService,
} from "./factory.services"

export async function createSessionInfoService({
  userId,
  teacherId,
  sessionReqId,
  transaction,
}: {
  userId: string
  teacherId: string
  sessionReqId: number
  transaction?: Transaction
}) {
  const infoBody: any = {
    userId,
    teacherId,
    sessionRequestId: sessionReqId,
  }
  const sessionInfo = await SessionInfo.create(infoBody, { transaction })
  if (!sessionInfo) {
    throw new AppError(400, "Can't create session info!")
  }
  return sessionInfo as SessionInfo
}
export async function checkUniqueUserAndTeacher({
  teacherId,
  userId,
}: {
  teacherId: string
  userId: string
}) {
  const session = await getOneModelByService({
    Model: SessionInfo,
    findOptions: { where: { userId, teacherId } },
  })
  if (session) {
    throw new AppError(
      400,
      "The User and Teacher together had free session before"
    )
  }
}
export async function getSessionInfoService({
  id,
  findOptions,
}: {
  id: string | number
  findOptions?: FindOptions
}) {
  const session = await getModelByIdService({
    ModelClass: SessionInfo,
    Id: id,
    findOptions,
  })
  if (!session) {
    throw new AppError(404, "can't find session with this id!")
  }
  return session
}
export async function getTeacherSessionInfoService({
  teacherId,
  include,
}: {
  teacherId: string
  include?: IncludeOptions
}) {
  const sessionInfo = await getAllModelsByService({
    Model: SessionInfo,
    findOptions: { where: { teacherId }, include },
  })
  if (!sessionInfo) {
    throw new AppError(404, "there is no session info with this teacherId !")
  }
  return sessionInfo as SessionInfo[]
}
export async function getUserSessionInfoService({
  userId,
  include,
}: {
  userId: string
  include?: IncludeOptions
}) {
  const sessionInfo = await getAllModelsByService({
    Model: SessionInfo,
    findOptions: { where: { userId }, include },
  })

  if (!sessionInfo) {
    throw new AppError(404, "there is no session info with this userId !")
  }
  return sessionInfo as SessionInfo[]
}
export async function getAllSessionsInfoService({
  findOptions,
}: {
  findOptions?: FindOptions
}) {
  const sessions = await getModelsService({
    ModelClass: SessionInfo,
    findOptions,
  })
  if (!sessions) {
    throw new AppError(400, "Can't get sessions!")
  }
  return sessions
}
export async function updateSessionInfoService({
  id,
  updatedData,
}: {
  id: number
  updatedData: any
}) {
  const updatedSession = await updateModelService({
    ModelClass: SessionInfo,
    id: id,
    updatedData,
  })
  if (!updatedSession) {
    throw new AppError(400, "Can't update session info!")
  }
  return updatedSession
}
