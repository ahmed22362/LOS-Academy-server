import { FindOptions, Transaction, where } from "sequelize"
import Session, { SessionStatus } from "../db/models/session.model"
import { SessionType } from "../db/models/session.model"
import AppError from "../utils/AppError"
import {
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
import SessionInfo from "../db/models/sessionInfo.model"
import { sequelize } from "../db/sequalize"
import ZoomService from "../connect/zoom"

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
  meetingLink: string
}

export interface ISessionDetails {
  id: number
  sessionDuration: number
  sessionDate: Date
  status: string
  type: string
  teacherAttended: boolean
  studentAttended: boolean
  userName: string
  userEmail: string
  teacherName: string
  teacherEmail: string
  meetingLink: string
}
interface UserSessions {
  [userName: string]: Session[]
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
  teacherId,
}: {
  id: number | string
  updatedData: Partial<ISessionUpdateTeacher>
  teacherId: string
}) {
  // to check if the teacher has this session in the session info
  const sessionsInfo = await getTeacherSessionInfoService({ teacherId })
  const session = await getOneSessionService({ id })
  const exist = sessionsInfo.some((info) => info.id === session.sessionInfoId)
  if (!exist) {
    throw new AppError(404, "The Teacher is not assign to this session")
  }
  if (!session.teacherAttended) {
    throw new AppError(
      401,
      "can't update status the session of absent teacher!"
    )
  }
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
export async function updateSessionService({
  sessionId,
  updatedData,
  transaction,
}: {
  sessionId: number
  updatedData: Partial<ISessionUpdateTeacher>
  transaction?: Transaction
}) {
  const session = await updateModelService({
    ModelClass: Session,
    id: sessionId,
    updatedData,
    transaction,
  })
  if (!session) {
    throw new AppError(400, "can't update session!")
  }
  return session as Session
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
  const sessions = await getModelsService({
    ModelClass: Session,
    findOptions: {
      include: [SessionInfo],
    },
  })
  if (!sessions) {
    throw new AppError(400, "Can't get sessions!")
  }
  return sessions
}
export async function getOneSessionDetailsService({
  sessionId,
}: {
  sessionId: number
}) {
  const [results, metadata] = await sequelize.query(`select 
    s.id, 
    s."sessionDuration", 
    s."sessionDate", 
    s.status, 
    s.type, 
    s."teacherAttended", 
    s."studentAttended", 
    u.name as userName, 
    u.email as userEmail, 
    t.name as teacherName, 
    t.email as teacherEmail, 
    s."meetingLink" 
  from 
    session_info as si 
    join session as s on si.id = s."sessionInfoId" 
    join "user" as u on si."userId" = u.id 
    join teacher as t on si."teacherId" = t.id
  where s.id = ${sessionId}`)
  return results[0] as ISessionDetails
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

export async function getUserAllDoneSessionsService({
  userId,
  status,
}: {
  userId: string
  status: SessionStatus
}) {
  const sessions = await generateGetterUserSessions({
    userId,
    status: SessionStatus.DONE,
  })
  return sessions
}
export async function getUserAllSessionsService({
  userId,
}: {
  userId: string
}) {
  const sessions = await generateGetterUserSessions({
    userId,
  })
  return sessions
}

export async function getUserUpcomingSessionsService({
  userId,
}: {
  userId: string
}) {
  const sessions = await generateGetterUserSessions({
    userId,
    status: SessionStatus.PENDING,
  })
  return sessions
}

export async function getAllSessionWithDetailsService() {
  const [results, metadata] = await sequelize.query(`select 
  s.id, 
  s."sessionDuration", 
  s."sessionDate", 
  s.status, 
  s.type, 
  s."teacherAttended", 
  s."studentAttended", 
  u.name as userName, 
  u.email as userEmail, 
  t.name as teacherName, 
  t.email as teacherEmail, 
  s."meetingLink" 
from 
  session_info as si 
  join session as s on si.id = s."sessionInfoId" 
  join "user" as u on si."userId" = u.id 
  join teacher as t on si."teacherId" = t.id

  `)

  if (!results) {
    throw new AppError(400, `Error Getting sessions`)
  }
  return results
}

export async function getTeacherAllSessionsService({
  teacherId,
}: {
  teacherId: string
}) {
  const session = await generateGetterTeacherSessions({ teacherId })
  return session
}
export async function getTeacherUpcomingSessionsService({
  teacherId,
}: {
  teacherId: string
}) {
  const sessions = await generateGetterTeacherSessions({
    teacherId,
    status: SessionStatus.PENDING,
  })
  return sessions
}

export async function updateSessionTeacherAttendanceService({
  sessionId,
  teacherId,
  attend,
  transaction,
}: {
  sessionId: number
  teacherId: string
  attend: boolean
  transaction?: Transaction
}) {
  // to check if the teacher has this session in the session info
  const sessionsInfo = await getTeacherSessionInfoService({ teacherId })
  const session = await getOneSessionService({ id: sessionId })
  const exist = sessionsInfo.some((info) => info.id === session.sessionInfoId)
  if (!exist) {
    throw new AppError(404, "The Teacher is not assign to this session")
  }
  session.teacherAttended = attend
  await session.save({ transaction })
}
export async function updateSessionStudentAttendanceService({
  sessionId,
  userId,
  attend,
  transaction,
}: {
  sessionId: number
  userId: string
  attend: boolean
  transaction?: Transaction
}) {
  // to check if the user has this session in the session info
  const sessionsInfo = await getUserSessionInfoService({ userId })
  const session = await getOneSessionService({ id: sessionId })
  const exist = sessionsInfo.some((info) => info.id === session.sessionInfoId)
  if (!exist) {
    throw new AppError(404, "The student is not assign to this session")
  }
  session.studentAttended = attend
  await session.save({ transaction })
}
export async function generateMeetingLinkAndUpdateSession({
  sessionId,
  transaction,
}: {
  sessionId: number
  transaction?: Transaction
}) {
  const session = await getOneSessionDetailsService({ sessionId })
  const meetingLink = await new ZoomService().createMeeting({
    topic: "Session",
    duration: session.sessionDuration,
    startDateTime: session.sessionDate,
  })
  const updatedSession = await updateSessionService({
    sessionId,
    updatedData: { meetingLink },
    transaction,
  })
  return updatedSession
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
async function generateGetterUserSessions({
  userId,
  status,
}: {
  userId: string
  status?: SessionStatus
}) {
  const sessionInfo = await getUserSessionInfoService({ userId })
  const userSessions: UserSessions = {}

  for (let info of sessionInfo) {
    const where: any = { sessionInfoId: info.id }

    if (status) {
      where.status = status
    }
    const sessions = await getAllModelsByService({
      Model: Session,
      findOptions: {
        where,
      },
    })
    if (!sessions) {
      throw new AppError(404, "there is no sessions with this session info!")
    }
    userSessions[`${info.teacher!.name} - ${info.teacher!.email}`] = sessions
  }
  return userSessions
}
async function generateGetterTeacherSessions({
  teacherId,
  status,
}: {
  teacherId: string
  status?: SessionStatus
}) {
  const sessionInfo = await getTeacherSessionInfoService({ teacherId })
  const userSessions: UserSessions = {}
  for (let info of sessionInfo) {
    const where: any = { sessionInfoId: info.id }

    if (status) {
      where.status = status
    }
    const sessions = await getAllModelsByService({
      Model: Session,
      findOptions: {
        where,
      },
    })
    if (!sessions) {
      throw new AppError(404, "there is no sessions with this session info!")
    }
    userSessions[`${info.user!.name} - ${info.user!.email}`] = sessions
  }

  return userSessions
}
