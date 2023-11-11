import { FindOptions, Op, Transaction, WhereOptions } from "sequelize"
import Session, { SessionStatus } from "../db/models/session.model"
import { SessionType } from "../db/models/session.model"
import AppError from "../utils/AppError"
import { deleteModelService, updateModelService } from "./factory.services"
import { DATE_PATTERN, FREE_SESSION_DURATION } from "./sessionReq.service"
import {
  createSessionInfoService,
  getTeacherSessionInfoService,
  getUserSessionInfoService,
} from "./sessionInfo.service"
import SessionInfo from "../db/models/sessionInfo.model"
import ZoomService from "../connect/zoom"
import Teacher from "../db/models/teacher.model"
import User from "../db/models/user.model"
import { getUserAttr } from "../controller/user.controller"
import { getTeacherAtt } from "../controller/teacher.controller"
import { scheduleSessionReminderMailJob } from "../utils/scheduler"
import logger from "../utils/logger"

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
  const reminderTime = new Date(session.sessionDate)
  reminderTime.setMinutes(reminderTime.getMinutes() - 30)
  logger.info(reminderTime.toUTCString())
  scheduleSessionReminderMailJob({
    userId,
    teacherId,
    sessionDate: reminderTime,
    sessionTitle: `session-${session.id}`,
  })
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
    const reminderTime = new Date(session.sessionDate)
    reminderTime.setMinutes(reminderTime.getMinutes() - 30)
    scheduleSessionReminderMailJob({
      userId,
      teacherId,
      sessionDate: reminderTime,
      sessionTitle: `session-${session.id}`,
    })
    sessions.push(session as Session)
  }

  return sessions
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
export async function rescheduleSessionService({
  id,
  updatedData,
}: {
  id: number
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
  transaction,
}: {
  id: number
  updatedData: Partial<ISessionUpdateTeacher>
  teacherId: string
  transaction?: Transaction
}) {
  // to check if the teacher has this session in the session info
  const { exist, session } = await teacherOwnThisSession({
    teacherId,
    sessionId: id,
  })

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
    transaction,
  })
  if (!updateModelService) {
    throw new AppError(400, "Can't update service!")
  }
  return updatedSession
}
export async function deleteSessionService({ id }: { id: number }) {
  await deleteModelService({ ModelClass: Session, id })
}
export async function getAllSessionsService({
  findOptions,
}: {
  findOptions?: FindOptions
}) {
  const sessions = await Session.findAll(findOptions)
  return sessions
}
export async function getAllSessionsServiceByStatus({
  status,
  page,
  pageSize,
}: {
  status?: SessionStatus
  page?: number
  pageSize?: number
}) {
  let limit
  let offset
  let where: WhereOptions = {}

  if (pageSize) limit = pageSize
  if (page && pageSize) offset = page * pageSize
  if (status) where.status = status

  const sessions = await Session.findAll({
    include: [
      {
        model: SessionInfo,
        attributes: ["userId", "teacherId"],
        include: [
          { model: User, attributes: getUserAttr },
          { model: Teacher, attributes: getTeacherAtt },
        ],
      },
    ],
    where,
    limit,
    offset,
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
  const session = await Session.findByPk(sessionId, {
    include: [
      {
        model: SessionInfo,
        attributes: ["userId", "teacherId"],
        include: [
          { model: User, attributes: getUserAttr },
          { model: Teacher, attributes: getTeacherAtt },
        ],
      },
    ],
  })
  if (!session) {
    throw new AppError(404, "can't find session with this id!")
  }
  return session
}
export async function getUserAllTakenSessionsService({
  userId,
}: {
  userId: string
}) {
  const sessions = await generateGetterUserSessions({
    userId,
    status: SessionStatus.TAKEN,
  })
  return sessions
}
export async function getUserAllSessionsService({
  userId,
  page,
  pageSize,
}: {
  userId: string
  page?: number
  pageSize?: number
}) {
  const sessions = await generateGetterUserSessions({
    userId,
    page,
    pageSize,
  })
  return sessions
}
export async function getUserRemainSessionsService({
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
export async function getUserUpcomingSessionService({
  userId,
}: {
  userId: string
}) {
  const session = await generateGetterUserSessions({
    userId,
    status: SessionStatus.PENDING,
    pageSize: 1,
  })
  return session
}
export async function getTeacherAllSessionsService({
  teacherId,
  page,
  pageSize,
}: {
  teacherId: string
  page?: number
  pageSize?: number
}) {
  const session = await generateGetterTeacherSessions({
    teacherId,
    page,
    pageSize,
  })
  return session
}
export async function getTeacherUpcomingSessionService({
  teacherId,
}: {
  teacherId: string
}) {
  const session = await generateGetterTeacherSessions({
    teacherId,
    status: SessionStatus.PENDING,
    pageSize: 1,
  })
  return session
}
export async function getTeacherRemainSessionsService({
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
export async function getTeacherTakenSessionsService({
  teacherId,
}: {
  teacherId: string
}) {
  const sessions = await generateGetterTeacherSessions({
    teacherId,
    status: SessionStatus.TAKEN,
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
  const { exist, session } = await teacherOwnThisSession({
    teacherId,
    sessionId,
  })
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
  const { exist, session } = await userOwnThisSession({
    userId,
    sessionId,
  })
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
async function generateGetterUserSessions({
  userId,
  status,
  page,
  pageSize,
}: {
  userId: string
  status?: SessionStatus
  page?: number
  pageSize?: number
}) {
  const sessionInfo = await getUserSessionInfoService({
    userId,
    include: { model: Teacher },
  })
  const sessionInfoIds = sessionInfo.map((info) => info.id)
  const where: WhereOptions = {
    sessionInfoId: { [Op.in]: sessionInfoIds },
  }
  if (status) {
    where.status = status
  }
  let limit
  let offset
  if (pageSize) limit = pageSize
  if (pageSize && page) offset = page * pageSize
  const sessions = await getAllSessionsService({
    findOptions: {
      include: [
        {
          model: SessionInfo,
          attributes: ["teacherId"],
          include: [{ model: Teacher, attributes: getTeacherAtt }],
        },
      ],
      where,
      limit,
      offset,
      order: [["sessionDate", "ASC"]],
    },
  })
  return sessions
}
async function generateGetterTeacherSessions({
  teacherId,
  status,
  page,
  pageSize,
}: {
  teacherId: string
  status?: SessionStatus
  page?: number
  pageSize?: number
}) {
  const sessionInfo = await getTeacherSessionInfoService({
    teacherId,
    include: { model: User },
  })
  const sessionInfoIds = sessionInfo.map((info) => info.id)
  const where: WhereOptions = {
    sessionInfoId: { [Op.in]: sessionInfoIds },
  }
  if (status) {
    where.status = status
  }
  let limit
  let offset
  if (pageSize) limit = pageSize
  if (pageSize && page) offset = page * pageSize
  const sessions = await getAllSessionsService({
    findOptions: {
      include: [
        {
          model: SessionInfo,
          attributes: ["userId"],
          include: [{ model: User, attributes: getUserAttr }],
        },
      ],
      where,
      limit,
      offset,
    },
  })
  return sessions
}
export async function getSessionInfosSessions(sessionInfoIds: number[]) {
  const sessions = await Session.findAll({
    where: {
      sessionInfoId: {
        [Op.in]: sessionInfoIds,
      },
    },
  })
  return sessions
}
export async function teacherOwnThisSession({
  teacherId,
  sessionId,
}: {
  teacherId: string
  sessionId: number
}) {
  const sessionsInfo = await getTeacherSessionInfoService({ teacherId })
  const session = await getOneSessionDetailsService({ sessionId })
  const exist = sessionsInfo.some((info) => info.id === session.sessionInfoId)
  return { exist, session }
}
export async function userOwnThisSession({
  userId,
  sessionId,
}: {
  userId: string
  sessionId: number
}) {
  const sessionsInfo = await getUserSessionInfoService({ userId })
  const session = await getOneSessionDetailsService({ sessionId })
  const exist = sessionsInfo.some((info) => info.id === session.sessionInfoId)
  return { exist, session }
}
export function checkDateFormat(date: string) {
  if (!DATE_PATTERN.test(date)) {
    const errorMessage =
      "Input does not match the pattern. Date string must be a valid ISO 8601 UTC date 'YYYY-MM-DDTHH:mm:ss.sssZ'"

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
  for (let session = 0; session < sessionCount; session++) {
    const weekIndex = Math.floor(session / sessionsPerWeek)
    const date = sessionDates[session % sessionsPerWeek]
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
  return sessions
}
