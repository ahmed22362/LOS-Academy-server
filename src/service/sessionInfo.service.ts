import SessionInfo from "../db/models/sessionInfo.model"
import AppError from "../utils/AppError"
import { createModelService, getOneModelByService } from "./factory.services"
import { IInfoBody } from "./session.service"

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
