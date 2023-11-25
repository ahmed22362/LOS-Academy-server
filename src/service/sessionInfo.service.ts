import {
  FindOptions,
  IncludeOptions,
  Transaction,
  WhereOptions,
} from "sequelize"
import SessionInfo from "../db/models/sessionInfo.model"
import AppError from "../utils/AppError"
import {
  deleteModelService,
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
  willContinue,
}: {
  userId: string
  teacherId: string
  sessionReqId: number
  willContinue?: boolean
  transaction?: Transaction
}) {
  const infoBody: any = {
    userId,
    teacherId,
    sessionRequestId: sessionReqId,
    willContinue,
  }
  const sessionInfo = await SessionInfo.create(infoBody, { transaction })
  if (!sessionInfo) {
    throw new AppError(400, "Can't create session info!")
  }
  return sessionInfo
}
export async function checkUniqueUserAndTeacher({
  teacherId,
  userId,
}: {
  teacherId: string
  userId: string
}) {
  const sessionInfo = await getOneModelByService({
    Model: SessionInfo,
    findOptions: { where: { userId, teacherId } },
  })
  if (sessionInfo) {
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
  const sessionInfo = await getModelByIdService({
    ModelClass: SessionInfo,
    Id: id,
    findOptions,
  })
  if (!sessionInfo) {
    throw new AppError(404, "can't find sessionInfo with this id!")
  }
  return sessionInfo as SessionInfo
}
export async function getOneSessionInfoServiceBy({
  where,
  include,
}: {
  where: WhereOptions
  include?: IncludeOptions[]
}) {
  const sessionInfo = await SessionInfo.findOne({
    include,
    where,
    order: [["updatedAt", "DESC"]],
  })
  return sessionInfo
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
  transaction,
}: {
  id: number
  updatedData: any
  transaction?: Transaction
}) {
  const [sessionCo, updatedSession] = await SessionInfo.update(updatedData, {
    where: { id },
    transaction,
    returning: true,
  })
  if (!updatedSession) {
    throw new AppError(400, "Can't update session info!")
  }
  return updatedSession
}
export async function updateOneSessionInfoService({
  id,
  updatedData,
  transaction,
}: {
  id: number
  updatedData: any
  transaction?: Transaction
}) {
  const [sessionCount, updatedSession] = await SessionInfo.update(updatedData, {
    where: { id },
    transaction,
    returning: true,
  })
  if (updatedSession.length === 0) {
    throw new AppError(400, "Can't update session info!")
  }
  return updatedSession[0]
}
export async function deleteSessionInfoService({
  sessionInfoId,
}: {
  sessionInfoId: number
}) {
  await deleteModelService({ ModelClass: SessionInfo, id: sessionInfoId })
}
