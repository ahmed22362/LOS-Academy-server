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
import { DATE_PATTERN, FREE_SESSION_DURATION } from "./sessionReq.service"
import ZoomService from "../connect/zoom"
import { createSessionInfoService } from "./sessionInfo.service"

export interface IInfoBody {
  userId: string
  teacherId: string
  sessionRequestId: number
}

export interface ISessionBody {
  sessionDate: Date
  sessionDuration: number
  type: string
  sessionInfoId: number
  sessionStartTime: string
}

export async function createFreeSessionService({
  userId,
  teacherId,
  sessionDate,
  sessionReqId,
}: {
  userId: string
  teacherId: string
  sessionDate: Date
  sessionReqId: number
}) {
  const start_time = sessionDate.toISOString().split("T")[1]
  console.log(userId, teacherId, sessionDate, sessionReqId, "in create session")
  const sessionInfo = await createSessionInfoService({
    userId,
    teacherId,
    sessionReqId,
  })

  const sessionBody: ISessionBody = {
    sessionDate,
    sessionDuration: FREE_SESSION_DURATION,
    sessionInfoId: sessionInfo.id,
    type: SessionType.FREE,
    sessionStartTime: start_time,
  }
  const session = await createModelService({
    ModelClass: Session,
    data: sessionBody,
  })
  if (!session) {
    throw new AppError(400, "Can't create free session!")
  }
  return session
}

export async function createPaidSessionsService({
  userId,
  teacherId,
  sessionDates,
  sessionReqId,
  sessionDuration,
  sessionCount,
  sessionsPerWeek,
}: {
  userId: string
  teacherId: string
  sessionDates: Date[]
  sessionReqId: number
  sessionDuration: number
  sessionCount: number
  sessionsPerWeek: number
}): Promise<Session[]> {
  const sessionInfo = await createSessionInfoService({
    userId,
    teacherId,
    sessionReqId,
  })
  let sessions: Session[] = []
  console.log("before genereate", {
    sessionCount,
    sessionDuration,
    sessionInfoId: sessionInfo.id,
    sessionDates,
    sessionsPerWeek,
  })
  const sessionsBody = generateSessions({
    sessionCount,
    sessionDuration,
    sessionInfoId: sessionInfo.id,
    sessionDates,
    sessionsPerWeek,
  })
  console.log(sessionsBody)
  for (let s of sessionsBody) {
    const session = await createModelService({
      ModelClass: Session,
      data: { ...s },
    })
    if (!session) {
      throw new AppError(400, "Can't create paid session!")
    }
    sessions.push(session as Session)
  }

  return sessions
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
export function checkDateFormat(date: string) {
  if (!DATE_PATTERN.test(date)) {
    const errorMessage =
      "Input does not match the pattern. Please use the format 'YYYY-MM-DD HH:MM:SS'"
    throw new AppError(400, errorMessage)
  }
}

function generateSessions({
  sessionCount,
  sessionDates,
  sessionsPerWeek,
  sessionInfoId,
  sessionDuration,
}: {
  sessionCount: number
  sessionDates: Date[]
  sessionsPerWeek: number
  sessionInfoId: number
  sessionDuration: number
}) {
  const sessions: ISessionBody[] = []
  const milSecToWeek = 7 * 24 * 60 * 60 * 1000
  console.log({
    sessionCount,
    sessionDates,
    sessionsPerWeek,
    sessionInfoId,
    sessionDuration,
  })
  for (let session = 0; session < sessionCount; session++) {
    const weekIndex = Math.floor(session / sessionsPerWeek)
    const date = sessionDates[session % sessionsPerWeek]
    console.log(date, session % sessionsPerWeek)
    if (!date) {
      throw new AppError(400, "date is not defined while generating sessions!")
    }
    const timestamp = date?.valueOf()
    const newDate = new Date(timestamp + weekIndex * milSecToWeek)

    const sessionTime = newDate.toISOString().split("T")[1]

    sessions.push({
      sessionDate: newDate,
      sessionDuration,
      sessionInfoId,
      type: SessionType.PAID,
      sessionStartTime: sessionTime,
    })
  }
  console.log(sessions)
  return sessions
}
