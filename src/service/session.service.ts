import { FindOptions, Transaction } from "sequelize"
import Session, { SessionStatus } from "../db/models/session.model"
import { SessionType } from "../db/models/session.model"
import AppError from "../utils/AppError"
import {
  createModelService,
  deleteModelService,
  getAllModelsByService,
  getModelByIdService,
  getModelsService,
  updateModelService,
} from "./factory.services"
import { DATE_PATTERN, FREE_SESSION_DURATION } from "./sessionReq.service"
import {
  createSessionInfoService,
  getTeacherSessionInfoService,
  getUserSessionInfoService,
} from "./sessionInfo.service"
import { sequelize } from "../db/sequalize"

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

export interface ISessionUpdateUser {
  sessionDate: Date
  sessionStartTime: number
}
export interface ISessionUpdateTeacher extends ISessionUpdateUser {
  status: SessionStatus
}
export async function createFreeSessionService({
  userId,
  teacherId,
  sessionDate,
  sessionReqId,
  transaction,
}: {
  userId: string
  teacherId: string
  sessionDate: Date
  sessionReqId: number
  transaction?: Transaction
}) {
  const start_time = sessionDate.toISOString().split("T")[1]
  const sessionInfo = await createSessionInfoService({
    userId,
    teacherId,
    sessionReqId,
    transaction,
  })

  const sessionBody: any = {
    sessionDate,
    sessionDuration: FREE_SESSION_DURATION,
    sessionInfoId: sessionInfo.id,
    type: SessionType.FREE,
    sessionStartTime: start_time,
  }
  const session = await Session.create(sessionBody, { transaction })
  if (!session) {
    throw new AppError(400, "Can't create free session!")
  }
}
export async function createPaidSessionsService({
  userId,
  teacherId,
  sessionDates,
  sessionReqId,
  sessionDuration,
  sessionCount,
  sessionsPerWeek,
  transaction,
}: {
  userId: string
  teacherId: string
  sessionDates: Date[]
  sessionReqId: number
  sessionDuration: number
  sessionCount: number
  sessionsPerWeek: number
  transaction?: Transaction
}): Promise<Session[]> {
  const sessionInfo = await createSessionInfoService({
    userId,
    teacherId,
    sessionReqId,
    transaction,
  })
  let sessions: Session[] = []
  const sessionsBody = generateSessions({
    sessionCount,
    sessionDuration,
    sessionInfoId: sessionInfo.id,
    sessionDates,
    sessionsPerWeek,
  })
  for (let s of sessionsBody) {
    const session = await Session.create({ ...(s as any) }, { transaction })
    if (!session) {
      throw new AppError(400, "Can't create paid session!")
    }
    sessions.push(session as Session)
  }

  return sessions
}
export async function rescheduleSessionService({
  id,
  updatedData,
}: {
  id: number | string
  updatedData: Partial<ISessionUpdateUser>
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
export async function updateSessionStatusService({
  id,
  updatedData,
}: {
  id: number | string
  updatedData: Partial<ISessionUpdateTeacher>
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

export async function getOneSessionService({
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
  return session as Session
}

export async function getUserAllSessionsService({
  userId,
}: {
  userId: string
}) {
  const sessionInfo = await getUserSessionInfoService({ userId })
  const sessions = await getAllModelsByService({
    Model: Session,
    findOptions: { where: { sessionInfoId: sessionInfo.id } },
  })
  if (!sessions) {
    throw new AppError(404, "there is no sessions with this session info!")
  }
  return sessions as Session[]
}

export async function getUserUpcomingSessionsService({
  userId,
}: {
  userId: string
}) {
  const sessionInfo = await getUserSessionInfoService({ userId })
  const sessions = await getAllModelsByService({
    Model: Session,
    findOptions: {
      where: {
        sessionInfoId: sessionInfo.id,
        status: SessionStatus.PENDING,
      },
    },
  })
  if (!sessions) {
    throw new AppError(404, "there is no sessions with this session info!")
  }
  return sessions as Session[]
}

interface UserSessions {
  [userName: string]: Session[]
}
export async function getTeacherAllSessionsService({
  teacherId,
}: {
  teacherId: string
}) {
  const sessionInfo = await getTeacherSessionInfoService({ teacherId })
  const userSessions: UserSessions = {}
  for (let info of sessionInfo) {
    const sessions = await getAllModelsByService({
      Model: Session,
      findOptions: {
        where: {
          sessionInfoId: info.id,
        },
      },
    })
    if (!sessions) {
      throw new AppError(404, "there is no sessions with this session info!")
    }
    userSessions[`${info.user!.name} - ${info.user!.email}`] = sessions
  }

  return userSessions
}
export async function getTeacherUpcomingSessionsService({
  teacherId,
}: {
  teacherId: string
}) {
  const sessionInfo = await getTeacherSessionInfoService({ teacherId })
  const userSessions: UserSessions = {}
  for (let info of sessionInfo) {
    const sessions = await getAllModelsByService({
      Model: Session,
      findOptions: {
        where: {
          sessionInfoId: info.id,
          status: SessionStatus.PENDING,
        },
      },
    })
    if (!sessions) {
      throw new AppError(404, "there is no sessions with this session info!")
    }
    userSessions[`${info.user!.name} - ${info.user!.email}`] = sessions
  }

  return userSessions
}

export async function updateSessionTeacherAttendance({
  sessionId,
  teacherId,
  attend,
}: {
  sessionId: number
  teacherId: string
  attend: boolean
}) {
  // to check if the teacher has this session in the session info
  const sessionsInfo = await getTeacherSessionInfoService({ teacherId })
  const session = await getOneSessionService({ id: sessionId })
  const exist = sessionsInfo.some((info) => info.id === session.sessionInfoId)
  if (!exist) {
    throw new AppError(404, "The Teacher is not assign to this session")
  }
  session.teacherAttended = attend
  await session.save()
}
export async function updateSessionStudentAttendance({
  sessionId,
  userId,
  attend,
}: {
  sessionId: number
  userId: string
  attend: boolean
}) {
  // to check if the user has this session in the session info
  const sessionsInfo = await getUserSessionInfoService({ userId })
  const session = await getOneSessionService({ id: sessionId })
  const exist = sessionsInfo.id === session.sessionInfoId
  if (!exist) {
    throw new AppError(404, "The student is not assign to this session")
  }
  session.studentAttended = attend
  await session.save()
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
