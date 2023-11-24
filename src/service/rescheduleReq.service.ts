import { FindOptions, Op, Transaction, WhereOptions } from "sequelize"
import RescheduleRequest, {
  RescheduleRequestStatus,
} from "../db/models/rescheduleReq.model"
import AppError from "../utils/AppError"
import { updateModelService } from "./factory.services"
import {
  getTeacherAllSessionsService,
  getUserAllSessionsService,
  teacherOwnThisSession,
  updateSessionService,
  userOwnThisSession,
} from "./session.service"
import Session from "../db/models/session.model"
import SessionInfo from "../db/models/sessionInfo.model"
import User from "../db/models/user.model"
import { getUserAttr } from "../controller/user.controller"
import Teacher, { RoleType } from "../db/models/teacher.model"
import { sequelize } from "../db/sequelize"
import logger from "../utils/logger"
import { getTeacherAtt } from "../controller/teacher.controller"
import { rescheduleSessionJobs } from "../utils/scheduler"

export async function createRescheduleRequestService({
  sessionId,
  newDatesOptions,
  oldDate,
  requestedBy,
}: {
  sessionId: number
  newDatesOptions: Date[]
  oldDate: Date
  requestedBy: RoleType
}) {
  const dateArr = newDatesOptions.map((str) => new Date(str))

  const reqBody = {
    sessionId,
    oldDate,
    newDatesOptions: dateArr,
    requestedBy,
  }
  const rescheduleRequest = await RescheduleRequest.create(reqBody as any)
  if (!rescheduleRequest) {
    throw new AppError(400, "can't create reschedule request!")
  }
  return rescheduleRequest
}
export async function getOneRescheduleRequestService({ id }: { id: number }) {
  const request = await RescheduleRequest.findByPk(id)
  if (!request) {
    throw new AppError(404, "there is no request with this id!")
  }
  return request
}
export async function getOneRescheduleRequestServiceWithUserDetailsService({
  requestId,
}: {
  requestId: number
}) {
  const request = await RescheduleRequest.findByPk(requestId, {
    attributes: [["id", "requestId"], "newDate"],
    include: [
      {
        model: Session,
        attributes: ["sessionDate", ["id", "sessionId"]],
        include: [
          {
            model: SessionInfo,
            attributes: ["userId"],
            include: [
              {
                model: User,
                attributes: ["name", "email"],
              },
            ],
          },
        ],
      },
    ],
  })
  if (!request) {
    throw new AppError(404, "Can't find reschedule request with this id!")
  }
  return request
}
export async function updateRescheduleRequestService({
  requestId,
  status,
  newDate,
  transaction,
}: {
  requestId: number
  status: RescheduleRequestStatus
  newDate?: Date
  transaction?: Transaction
}) {
  const reqBody: any = { status }
  if (newDate) {
    reqBody.newDate = newDate
  }
  const updatedRequest = await updateModelService({
    ModelClass: RescheduleRequest,
    id: requestId,
    updatedData: reqBody,
    transaction,
  })
  return updatedRequest as RescheduleRequest
}
export async function getAllRescheduleRequestsService({
  findOptions,
}: {
  findOptions?: FindOptions
}) {
  const requests = await RescheduleRequest.findAll(findOptions)
  return requests
}
export async function deleteRescheduleRequestService({
  requestId,
}: {
  requestId: number
}) {
  await RescheduleRequest.destroy({ where: { id: requestId } })
}
export async function getAllRescheduleRequestsWithUserService() {
  return await RescheduleRequest.findAll({
    attributes: ["id", "newDate"],
    include: [
      {
        model: Session,
        attributes: ["sessionDate"],
        include: [
          {
            model: SessionInfo,
            attributes: ["userId"],
            include: [
              {
                model: User,
                attributes: ["name", "email"],
              },
            ],
          },
        ],
      },
    ],
  })
}
export async function userRequestRescheduleService({
  sessionId,
  userId,
  newDatesOptions,
}: {
  sessionId: number
  userId: string
  newDatesOptions: Date[]
}) {
  const { session, exist } = await userOwnThisSession({ userId, sessionId })
  if (!exist) {
    throw new AppError(
      403,
      "Can't request session reschedule for session that is not yours!"
    )
  }
  const rescheduleRequest = createRescheduleRequestService({
    sessionId,
    newDatesOptions,
    oldDate: session!.sessionDate,
    requestedBy: RoleType.USER,
  })
  return rescheduleRequest
}
export async function teacherRequestRescheduleService({
  sessionId,
  teacherId,
  newDatesOptions,
}: {
  sessionId: number
  teacherId: string
  newDatesOptions: Date[]
}) {
  const { session, exist } = await teacherOwnThisSession({
    teacherId,
    sessionId,
  })
  if (!exist) {
    throw new AppError(
      403,
      "Can't request session reschedule for session that is not yours!"
    )
  }
  const rescheduleRequest = createRescheduleRequestService({
    sessionId,
    newDatesOptions,
    oldDate: session!.sessionDate,
    requestedBy: RoleType.TEACHER,
  })
  return rescheduleRequest
}

export async function getPendingRequestBySessionIdService({
  sessionId,
}: {
  sessionId: number
}) {
  const request = await RescheduleRequest.findOne({
    where: { sessionId, status: RescheduleRequestStatus.PENDING },
  })
  return request
}
export async function getUserAllRescheduleRequestsService({
  userId,
  page,
  pageSize,
  status,
  requestedBy,
}: {
  userId: string
  page?: number
  pageSize?: number
  status?: RescheduleRequestStatus
  requestedBy?: RoleType
}) {
  let limit
  let offset
  if (pageSize) limit = pageSize
  if (page && pageSize) offset = page * pageSize
  const sessions = await getUserAllSessionsService({ userId })
  const sessionsIds: number[] = sessions.map((session) => session.id)
  const where: WhereOptions = { sessionId: { [Op.in]: sessionsIds } }
  if (status) where.status = status
  if (requestedBy) where.requestedBy = requestedBy
  const rescheduleRequests = await RescheduleRequest.findAll({
    where,
    limit,
    offset,
    include: [
      {
        model: Session,
        attributes: ["sessionInfoId"],
        include: [
          {
            model: SessionInfo,
            attributes: ["teacherId"],
            include: [{ model: Teacher, attributes: getTeacherAtt }],
          },
        ],
      },
    ],
  })
  return rescheduleRequests
}
export async function getUserReceivedRescheduleRequestsService({
  userId,
}: {
  userId: string
}) {
  return getUserAllRescheduleRequestsService({
    userId,
    requestedBy: RoleType.TEACHER,
  })
}
export async function getUserRescheduleRequestsService({
  userId,
}: {
  userId: string
}) {
  return getUserAllRescheduleRequestsService({
    userId,
    requestedBy: RoleType.USER,
  })
}
export async function getTeacherAllRescheduleRequestsService({
  teacherId,
  page,
  pageSize,
  status,
  requestedBy,
}: {
  teacherId: string
  page?: number
  pageSize?: number
  status?: RescheduleRequestStatus
  requestedBy?: RoleType
}) {
  let limit
  let offset
  if (pageSize) limit = pageSize
  if (page && pageSize) offset = page * pageSize
  const sessions = await getTeacherAllSessionsService({ teacherId })
  const sessionsIds: number[] = sessions.map((session) => session.id)
  const where: WhereOptions = { sessionId: { [Op.in]: sessionsIds } }
  if (status) where.status = status
  if (requestedBy) where.requestedBy = requestedBy
  const rescheduleRequests = await RescheduleRequest.findAll({
    where,
    limit,
    offset,
    include: [
      {
        model: Session,
        attributes: ["sessionInfoId"],
        include: [
          {
            model: SessionInfo,
            attributes: ["userId"],
            include: [{ model: User, attributes: getUserAttr }],
          },
        ],
      },
    ],
  })
  return rescheduleRequests
}
export async function getTeacherReceivedRescheduleRequestsService({
  teacherId,
  page,
  pageSize,
  status,
}: {
  teacherId: string
  page?: number
  pageSize?: number
  status?: RescheduleRequestStatus
}) {
  return getTeacherAllRescheduleRequestsService({
    teacherId,
    requestedBy: RoleType.USER,
    page,
    pageSize,
    status,
  })
}
export async function getTeacherRescheduleRequestsService({
  teacherId,
  page,
  pageSize,
  status,
}: {
  teacherId: string
  page?: number
  pageSize?: number
  status?: RescheduleRequestStatus
}) {
  return getTeacherAllRescheduleRequestsService({
    teacherId,
    requestedBy: RoleType.TEACHER,
    page,
    pageSize,
    status,
  })
}
export function datesMatch(d1: Date, d2: Date) {
  return d1.getTime() === d2.getTime()
}
