import { FindOptions } from "sequelize"
import SessionInfo from "../db/models/sessionInfo.model"
import AppError from "../utils/AppError"
import {
  createModelService,
  getAllModelsByService,
  getModelByIdService,
  getOneModelByService,
} from "./factory.services"
import { IInfoBody } from "./session.service"
import User from "../db/models/user.model"

export async function createSessionInfoService({
  userId,
  teacherId,
  sessionReqId,
}: {
  userId: string
  teacherId: string
  sessionReqId: number
}) {
  const infoBody: IInfoBody = {
    userId,
    teacherId,
    sessionRequestId: sessionReqId,
  }
  const sessionInfo = await createModelService({
    ModelClass: SessionInfo,
    data: infoBody,
  })
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
}: {
  teacherId: string
}) {
  const sessionInfo = await getAllModelsByService({
    Model: SessionInfo,
    findOptions: { where: { teacherId }, include: User },
  })
  if (!sessionInfo) {
    throw new AppError(404, "there is no session info with this teacherId !")
  }
  return sessionInfo as SessionInfo[]
}
export async function getUserSessionInfoService({
  userId,
}: {
  userId: string
}) {
  const sessionInfo = await getOneModelByService({
    Model: SessionInfo,
    findOptions: { where: { userId } },
  })
  if (!sessionInfo) {
    throw new AppError(404, "there is no session info with this userId !")
  }
  return sessionInfo as SessionInfo
}
