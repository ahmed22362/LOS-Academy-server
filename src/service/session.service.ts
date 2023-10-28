import { FindOptions } from "sequelize"
import SessionInfo from "../db/models/sessionInfo.model"
import Session from "../db/models/session.model"
import { SessionType } from "../db/models/session.model"
import AppError from "../utils/AppError"
import {
  createModelService,
  deleteModelService,
  getModelByIdService,
  getModelsService,
  updateModelService,
} from "./factory.services"
import { DATE_PATTERN } from "./sessionReq.service"
import ZoomService from "../connect/zoom"

export interface IInfoBody {
  userId: string
  teacherId: string
  sessionReqId: number
}

export interface ISessionBody {
  sessionDate: Date
  sessionDuration: number
  type: string
  sessionInfoId: number
}

export async function createSessionService({
  userId,
  teacherId,
  date,
  type,
  topic,
  duration,
  sessionReqId,
  sessionsCount,
}: {
  userId: string
  teacherId: string
  date: string
  type: SessionType
  topic: string
  duration: number
  sessionReqId: number
  sessionsCount: number
}) {
  if (!DATE_PATTERN.test(date)) {
    const errorMessage =
      "Input does not match the pattern. Please use the format 'YYYY-MM-DD HH:MM:SS'"
    throw new AppError(400, errorMessage)
  }
  const sessionDate = new Date(date)
  const start_date = new Date(date).toISOString().split("T")[0]
  const start_time = new Date(date).toISOString().split("T")[1]
  const meetingLink = await new ZoomService().createMeeting({
    topic,
    duration,
    start_date,
    start_time,
  })

  const infoBody: IInfoBody = {
    userId,
    teacherId,
    sessionReqId,
  }
  const sessionInfo = await createModelService({
    ModelClass: SessionInfo,
    data: infoBody,
  })
  if (!sessionInfo) {
    throw new AppError(400, "Can't create session info!")
  }
  const sessionBody: ISessionBody = {
    sessionDate,
    sessionDuration: duration,
    type,
    sessionInfoId: sessionInfo.id,
  }
  const session = await createModelService({
    ModelClass: Session,
    data: sessionBody,
  })
  if (!session) {
    throw new AppError(400, "Can't create session!")
  }
  return session
}

export async function updateSessionService({
  id,
  updatedData,
}: {
  id: number | string
  updatedData: any
}) {
  const updatedSession = await updateModelService({
    ModelClass: Session,
    id: id,
    updatedData,
  })
  if (!updateModelService) {
    throw new AppError(400, "Can't update service!")
  }
  return updatedSession
}
export async function updateSessionInfoService({
  id,
  updatedData,
}: {
  id: number | string
  updatedData: any
}) {
  const updatedSession = await updateModelService({
    ModelClass: Session,
    id: id,
    updatedData,
  })
  if (!updateModelService) {
    throw new AppError(400, "Can't update service!")
  }
  return updatedSession
}

export async function deleteSessionService({ id }: { id: string | number }) {
  await deleteModelService({ ModelClass: Session, id })
}
export async function deleteSessionInfoService({
  id,
}: {
  id: string | number
}) {
  await deleteModelService({ ModelClass: Session, id })
}

export async function getAllSessionsService({
  findOptions,
}: {
  findOptions?: FindOptions
}) {
  const sessions = await getModelsService({ ModelClass: Session, findOptions })
  if (!sessions) {
    throw new AppError(400, "Can't get sessions!")
  }
  return sessions
}
export async function getAllSessionsInfoService({
  findOptions,
}: {
  findOptions?: FindOptions
}) {
  const sessions = await getModelsService({ ModelClass: Session, findOptions })
  if (!sessions) {
    throw new AppError(400, "Can't get sessions!")
  }
  return sessions
}

export async function getSessionService({
  id,
  findOptions,
}: {
  id: string | number
  findOptions?: FindOptions
}) {
  const session = await getModelByIdService({
    ModelClass: Session,
    Id: id,
    findOptions,
  })
  if (!session) {
    throw new AppError(404, "can't find session with this id!")
  }
  return session
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
