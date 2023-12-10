import { FindOptions, Op, Transaction, WhereOptions } from "sequelize"
import Session, { SessionStatus } from "../db/models/session.model"
import { SessionType } from "../db/models/session.model"
import AppError from "../utils/AppError"
import { deleteModelService, updateModelService } from "./factory.services"
import { DATE_PATTERN, FREE_SESSION_DURATION } from "./sessionReq.service"
import {
  getTeacherSessionInfoService,
  getUserSessionInfoService,
} from "./sessionInfo.service"
import SessionInfo from "../db/models/sessionInfo.model"
import ZoomService from "../connect/zoom"
import Teacher from "../db/models/teacher.model"
import User from "../db/models/user.model"
import { getUserAttr } from "../controller/user.controller"
import { getTeacherAtt } from "../controller/teacher.controller"
import {
  scheduleSessionReminderMailJob,
  scheduleSessionStartReminderMailJob,
  scheduleUpdateSessionToFinished,
  scheduleUpdateSessionToOngoing,
} from "../utils/scheduler"
import { THREE_MINUTES_IN_MILLISECONDS } from "../controller/session.controller"

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
  hasReport?: boolean
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
export enum OrderAssociation {
  DESC = "DESC",
  ASC = "ASC",
}
export async function createFreeSessionService({
  sessionInfoId,
  sessionDate,
  transaction,
  studentName,
  studentEmail,
  teacherName,
  teacherEmail,
}: {
  sessionInfoId: number
  sessionDate: Date
  transaction?: Transaction
  studentName: string
  studentEmail: string
  teacherName: string
  teacherEmail: string
}) {
  const start_time = sessionDate.toISOString().split("T")[1]
  const sessionBody: any = {
    sessionDate,
    sessionDuration: FREE_SESSION_DURATION,
    sessionInfoId,
    type: SessionType.FREE,
    sessionStartTime: start_time,
  }
  const session = await Session.create(sessionBody, { transaction })
  if (!session) {
    throw new AppError(400, "Can't create free session!")
  }
  // send mail after 4 mins of the started session for the absent users
  await scheduleSessionStartReminderMailJob({
    sessionId: session.id,
    sessionDate: session.sessionDate,
  })
  // send mail before 30 of the session to remind both student and teacher
  await scheduleSessionReminderMailJob({
    sessionDate: session.sessionDate,
    sessionId: session.id,
    studentEmail,
    studentName,
    teacherEmail,
    teacherName,
  })
  // update the status of the session to be ongoing at it's time
  await scheduleUpdateSessionToOngoing({
    sessionId: session.id,
    sessionDate: session.sessionDate,
  })
  // update the status of the session to be finished based on the status of the absents
  await scheduleUpdateSessionToFinished({
    sessionId: session.id,
    sessionDate: session.sessionDate,
    sessionDuration: session.sessionDuration,
  })
  return session
}
export async function createPaidSessionsService({
  sessionInfoId,
  sessionDates,
  sessionDuration,
  sessionCount,
  sessionsPerWeek,
  transaction,
  studentName,
  studentEmail,
  teacherName,
  teacherEmail,
}: {
  sessionInfoId: number
  sessionDates: Date[]
  sessionDuration: number
  sessionCount: number
  sessionsPerWeek: number
  transaction?: Transaction
  studentName: string
  studentEmail: string
  teacherName: string
  teacherEmail: string
}): Promise<Session[]> {
  let sessions: Session[] = []
  const sessionsBody = generateSessions({
    sessionCount,
    sessionDuration,
    sessionInfoId,
    sessionDates,
    sessionsPerWeek,
  })
  for (let s of sessionsBody) {
    const session = await Session.create({ ...(s as any) }, { transaction })
    if (!session) {
      throw new AppError(400, "Can't create paid session!")
    }
    // send mail after 4 mins of the started session for the absent users
    await scheduleSessionStartReminderMailJob({
      sessionId: session.id,
      sessionDate: session.sessionDate,
    })
    // send mail before 30 of the session to remind both student and teacher
    await scheduleSessionReminderMailJob({
      sessionDate: session.sessionDate,
      sessionId: session.id,
      studentEmail,
      studentName,
      teacherEmail,
      teacherName,
    })
    // update the status of the session to be ongoing at it's time
    await scheduleUpdateSessionToOngoing({
      sessionId: session.id,
      sessionDate: session.sessionDate,
    })
    // update the status of the session to be finished based on the status of the absents
    await scheduleUpdateSessionToFinished({
      sessionId: session.id,
      sessionDate: session.sessionDate,
      sessionDuration: session.sessionDuration,
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
    throw new AppError(400, `can't update session!`)
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

  transaction,
}: {
  id: number
  updatedData: Partial<ISessionUpdateTeacher>
  transaction?: Transaction
}) {
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
export async function updateSessionsService({
  values,
  where,
  transaction,
}: {
  values: object
  where: WhereOptions
  transaction?: Transaction
}) {
  const [affectedRows, updatedDate] = await Session.update(values, {
    where,
    returning: true,
    transaction,
  })
  return updatedDate
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
export async function getOneSessionService({
  sessionId,
}: {
  sessionId: number
}) {
  const session = await Session.findByPk(sessionId)
  if (!session) {
    throw new AppError(404, "There is no session with this id!")
  }
  return session
}
export async function getOneSessionWithSessionInfoOnlyService({
  sessionId,
}: {
  sessionId: number
}) {
  const session = await Session.findByPk(sessionId, {
    include: [{ model: SessionInfo }],
  })
  if (!session) {
    throw new AppError(404, "There is no session with this id!")
  }
  return session
}
export async function getUserAllTakenSessionsService({
  userId,
}: {
  userId: string
}) {
  const sessions = await allTeacherOrUserSessionsService({
    userId,
    status: SessionStatus.TAKEN,
    orderAssociation: OrderAssociation.DESC,
  })
  return sessions
}
export async function getUserAllSessionsService({
  userId,
  page,
  pageSize,
  status,
  orderAssociation,
}: {
  userId: string
  page?: number
  pageSize?: number
  status?: SessionStatus
  orderAssociation: OrderAssociation
}) {
  const sessions = await allTeacherOrUserSessionsService({
    userId,
    page,
    pageSize,
    status,
    orderAssociation,
  })
  return sessions
}
export async function getUserRemainSessionsService({
  userId,
}: {
  userId: string
}) {
  const sessions = await allTeacherOrUserSessionsService({
    userId,
    status: SessionStatus.PENDING,
    orderAssociation: OrderAssociation.ASC,
  })
  return sessions
}
export async function getUserUpcomingSessionService({
  userId,
}: {
  userId: string
}) {
  const session = await allTeacherOrUserSessionsService({
    userId,
    status: SessionStatus.PENDING,
    pageSize: 1,
    upcoming: true,
    orderAssociation: OrderAssociation.ASC,
  })
  return session
}
export async function getUserOngoingSessionService({
  userId,
}: {
  userId: string
}) {
  const session = await allTeacherOrUserSessionsService({
    userId,
    status: SessionStatus.ONGOING,
    orderAssociation: OrderAssociation.ASC,
  })
  return session
}

export async function getUserLatestTakenSessionService({
  userId,
}: {
  userId: string
}) {
  const session = await allTeacherOrUserSessionsService({
    pageSize: 1,
    userId,
    status: SessionStatus.TAKEN,
    orderAssociation: OrderAssociation.DESC,
  })
  return session
}
export async function getTeacherAllSessionsService({
  teacherId,
  page,
  pageSize,
  status,
}: {
  teacherId: string
  page?: number
  pageSize?: number
  status?: string
}) {
  const session = await allTeacherOrUserSessionsService({
    teacherId,
    page,
    pageSize,
    status,
    orderAssociation: OrderAssociation.ASC,
  })
  return session
}
export async function getTeacherUpcomingSessionService({
  teacherId,
}: {
  teacherId: string
}) {
  const session = await allTeacherOrUserSessionsService({
    teacherId,
    status: SessionStatus.PENDING,
    pageSize: 1,
    upcoming: true,
    orderAssociation: OrderAssociation.ASC,
  })
  return session
}
export async function getTeacherOngoingSessionService({
  teacherId,
}: {
  teacherId: string
}) {
  const session = await allTeacherOrUserSessionsService({
    teacherId,
    status: SessionStatus.ONGOING,
    orderAssociation: OrderAssociation.ASC,
  })
  return session
}
export async function getTeacherLatestTakenSessionService({
  teacherId,
}: {
  teacherId: string
}) {
  const session = await allTeacherOrUserSessionsService({
    pageSize: 1,
    teacherId,
    status: SessionStatus.TAKEN,
    orderAssociation: OrderAssociation.DESC,
  })
  return session
}
export async function getTeacherRemainSessionsService({
  teacherId,
}: {
  teacherId: string
}) {
  const sessions = await allTeacherOrUserSessionsService({
    teacherId,
    status: SessionStatus.PENDING,
    orderAssociation: OrderAssociation.ASC,
  })
  return sessions
}
export async function getTeacherTakenSessionsService({
  teacherId,
}: {
  teacherId: string
}) {
  const sessions = await allTeacherOrUserSessionsService({
    teacherId,
    status: SessionStatus.TAKEN,
    orderAssociation: OrderAssociation.DESC,
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
  if (!canAttendSession(session.sessionDate)) {
    throw new AppError(
      400,
      "Can't update attendance now because 15 mins passed!"
    )
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
  if (!canAttendSession(session.sessionDate)) {
    throw new AppError(
      400,
      "Can't update attendance now because 15 mins passed!"
    )
  }
  session.studentAttended = attend
  await session.save({ transaction })
}
export async function generateMeetingLinkAndUpdateSession({
  sessionId,
  status,
  transaction,
}: {
  sessionId: number
  status?: SessionStatus
  transaction?: Transaction
}) {
  const session = await getOneSessionService({ sessionId })
  const meetingLink = await new ZoomService().createMeeting({
    topic: "Session",
    duration: session.sessionDuration,
    startDateTime: session.sessionDate,
  })
  const updatedData: any = { meetingLink }
  if (status) {
    updatedData.status = status
  }
  const updatedSession = await updateSessionService({
    sessionId,
    updatedData,
    transaction,
  })
  return updatedSession
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
export async function getTeacherSessionsStatisticsService({
  teacherId,
}: {
  teacherId: string
}) {
  const sessionInfo = await getTeacherSessionInfoService({
    teacherId,
  })
  const sessionInfoIds = sessionInfo.map((info) => info.id)
  const stats = await Session.count({
    attributes: ["status"],
    group: "status",
    where: { sessionInfoId: { [Op.in]: sessionInfoIds } },
  })
  return stats
}
export async function getAdminSessionsStatisticsService() {
  const sessionStats = await Session.count({
    attributes: ["status"],
    group: "status",
  })
  return sessionStats
}
// helper functions

async function allTeacherOrUserSessionsService({
  teacherId,
  userId,
  status,
  page,
  pageSize,
  upcoming,
  whereObj,
  orderAssociation,
}: {
  teacherId?: string
  userId?: string
  status?: string
  page?: number
  pageSize?: number
  upcoming?: boolean
  orderAssociation: OrderAssociation
  whereObj?: object
}) {
  let sessionInfo: SessionInfo[]
  let idAttribute: string
  let includeObj: object
  if (teacherId) {
    sessionInfo = await getTeacherSessionInfoService({
      teacherId,
    })
    idAttribute = "userId"
    includeObj = { model: User, attributes: getUserAttr }
  } else if (userId) {
    sessionInfo = await getUserSessionInfoService({
      userId,
    })
    idAttribute = "teacherId"
    includeObj = { model: Teacher, attributes: getTeacherAtt }
  } else {
    return
  }
  const sessionInfoIds = sessionInfo.map((info) => info.id)
  let where: WhereOptions = {
    sessionInfoId: { [Op.in]: sessionInfoIds },
  }
  if (status) {
    where.status = status
  }
  if (upcoming) {
    const currentDate = new Date()
    where.sessionDate = { [Op.gte]: { currentDate } }
  }
  if (whereObj) {
    where = { ...where, ...whereObj }
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
          attributes: [idAttribute],
          include: [includeObj],
        },
      ],
      where,
      limit,
      offset,
      order: [["sessionDate", orderAssociation]],
    },
  })
  if (!sessions) {
    throw new AppError(400, "Error getting sessions")
  }
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
  if (sessionsPerWeek !== sessionDates.length) {
    throw new AppError(
      400,
      `Your request has dates that is not equal to your sessions per week plan 
      your session per week is:${sessionsPerWeek} 
      you dates you provided length:${sessionDates.length}and are ${sessionDates}`
    )
  }
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
export function isSessionWithinTimeRange(sessionDate: Date): boolean {
  const currentTime: Date = new Date()
  const timeRangeStart: Date = new Date(
    sessionDate.getTime() - THREE_MINUTES_IN_MILLISECONDS
  )
  return timeRangeStart.getTime() <= currentTime.getTime()
}
export function isSessionAfterItsTimeRange(
  sessionDate: Date,
  sessionDuration: number
): boolean {
  const currentTime: Date = new Date()
  const timeRangeStart: Date = new Date(
    currentTime.getMinutes() + sessionDuration
  )
  return timeRangeStart.getTime() >= sessionDate.getTime()
}
export async function isThereOngoingSessionForTheSameTeacher({
  teacherId,
}: {
  teacherId: string
}) {
  const sessions = await getTeacherAllSessionsService({
    teacherId,
    status: SessionStatus.ONGOING,
  })
  if (sessions && sessions.length > 0) {
    throw new AppError(
      400,
      "Can't update session to be ongoing while there is another ongoing one!"
    )
  }
  return false
}
// Constants
const MS_IN_MINUTE = 1000 * 60

export function canRescheduleSession(sessionDate: Date) {
  const currentDate = new Date()

  // If session date is in the past - allow reschedule
  if (sessionDate.getTime() < currentDate.getTime()) {
    return true
  }

  const diffInMs = sessionDate.getTime() - currentDate.getTime()

  // Convert to minutes and check if >= 10
  const diffInMinutes = Math.ceil(diffInMs / MS_IN_MINUTE)
  return diffInMinutes >= 10
}
export function canAttendSession(sessionDate: Date) {
  const currentDate = new Date()
  const attendanceMargin = 15
  if (currentDate.getTime() < sessionDate.getTime()) {
    return false
  } else if (
    sessionDate.getTime() + attendanceMargin * MS_IN_MINUTE >
    currentDate.getTime()
  ) {
    return false
  } else return true
}
export async function isTeacherHasOverlappingSessions({
  teacherId,
  wantedSessionDates,
  wantedSessionDuration,
}: {
  teacherId: string
  wantedSessionDates: Date[]
  wantedSessionDuration: number
}) {
  const teacherSessions = await getTeacherRemainSessionsService({ teacherId })

  if (!Array.isArray(teacherSessions)) {
    throw new AppError(400, "Can't get teacher sessions")
  }

  // Sort all sessions by start time
  teacherSessions.sort(
    (a, b) => a.sessionDate.getTime() - b.sessionDate.getTime()
  )

  // Check each wanted date
  for (let wantedDate of wantedSessionDates) {
    // Get wanted range for overlapping sessions
    const wantedStart = wantedDate.getTime()
    const wantedEnd =
      wantedDate.getTime() + wantedSessionDuration * MS_IN_MINUTE
    // Binary search
    let lowerIdx = 0
    let upperIdx = teacherSessions.length - 1

    while (lowerIdx <= upperIdx) {
      const midIdx = Math.floor((lowerIdx + upperIdx) / 2)
      const session = teacherSessions[midIdx]
      const sessionEndDate =
        session.sessionDate.getTime() + session.sessionDuration * MS_IN_MINUTE
      if (wantedStart >= sessionEndDate) {
        lowerIdx = midIdx + 1
      } else if (wantedEnd <= session.sessionDate.getTime()) {
        upperIdx = midIdx - 1
      } else {
        throw new AppError(
          400,
          `Teacher has conflict in times with his sessions wantedDate: ${wantedDate}, session with conflict: ${session.sessionDate}`
        )
      }
    }
  }
  return false
}
