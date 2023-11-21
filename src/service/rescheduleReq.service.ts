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
import Session, { SessionStatus } from "../db/models/session.model"
import SessionInfo from "../db/models/sessionInfo.model"
import User from "../db/models/user.model"
import { getUserAttr } from "../controller/user.controller"
import Teacher, { RoleType } from "../db/models/teacher.model"
import { sequelize } from "../db/sequelize"
import logger from "../utils/logger"
import { getTeacherAtt } from "../controller/teacher.controller"

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

  // Check if actual Date instance
  dateArr.forEach((d) => {
    console.log(d.getTime())
    console.log(d instanceof Date)
  })
  const reqBody = {
    sessionId,
    oldDate,
    newDatesOptions: dateArr,
    requestedBy,
  }
  logger.info(reqBody)
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
  logger.info(newDatesOptions)
  const rescheduleRequest = createRescheduleRequestService({
    sessionId,
    newDatesOptions,
    oldDate: session!.sessionDate,
    requestedBy: RoleType.TEACHER,
  })
  return rescheduleRequest
}
export async function teacherAcceptOrDeclineRescheduleRequestService({
  requestId,
  teacherId,
  status,
  newDate,
}: {
  requestId: number
  teacherId: string
  status: RescheduleRequestStatus
  newDate?: Date
}) {
  const rescheduleRequest = await getOneRescheduleRequestService({
    id: requestId,
  })
  if (rescheduleRequest.requestedBy === RoleType.TEACHER) {
    throw new AppError(403, "can't update status of request that you asked!")
  }
  if (rescheduleRequest.status !== RescheduleRequestStatus.PENDING) {
    throw new AppError(400, "Already responded to!")
  }
  // to check if the teacher has this session to accept the request
  const { exist, session } = await teacherOwnThisSession({
    teacherId,
    sessionId: rescheduleRequest.sessionId,
  })
  if (!exist) {
    throw new AppError(401, "can't accept request for session is not yours")
  }

  if (status === RescheduleRequestStatus.APPROVED) {
    const dateStr = rescheduleRequest.newDatesOptions.join(", ")
    const match = rescheduleRequest.newDatesOptions.some((d) => {
      return datesMatch(d, newDate as Date)
    })
    if (!match) {
      throw new AppError(
        400,
        `please provide date that in the the reschedule request in: ${dateStr}`
      )
    }
  }
  const transaction = await sequelize.transaction()
  try {
    const updatedRequest = await updateRescheduleRequestService({
      requestId,
      status,
      newDate,
      transaction,
    })
    if (status === RescheduleRequestStatus.DECLINED) {
      await transaction.commit()
      return updatedRequest
    }
    // update session
    const updatedSession = await updateSessionService({
      sessionId: rescheduleRequest.sessionId,
      updatedData: {
        sessionDate: updatedRequest!.newDate,
        teacherAttended: false,
        userAttended: false,
        meetingLink: null,
        transaction,
      } as any,
    })
    await transaction.commit()
    return updatedSession as Session
  } catch (error: any) {
    await transaction.rollback()
    throw new AppError(400, `Error updating request :${error.message}`)
  }
}
export async function userAcceptOrDeclineRescheduleRequestService({
  requestId,
  userId,
  status,
  newDate,
}: {
  requestId: number
  userId: string
  status: RescheduleRequestStatus
  newDate?: Date
}) {
  const rescheduleRequest = await getOneRescheduleRequestService({
    id: requestId,
  })
  if (rescheduleRequest.requestedBy === RoleType.USER) {
    throw new AppError(403, "can't update status of request that you asked!")
  }
  if (rescheduleRequest.status !== RescheduleRequestStatus.PENDING) {
    throw new AppError(400, "Already responded to!")
  }
  // to check if the teacher has this session to accept the request
  const { exist, session } = await userOwnThisSession({
    userId,
    sessionId: rescheduleRequest.sessionId,
  })
  if (!exist) {
    throw new AppError(401, "can't accept request for session is not yours")
  }
  const newSessionDate = new Date(newDate as Date)
  if (
    status === RescheduleRequestStatus.APPROVED &&
    !rescheduleRequest.newDatesOptions.includes(newSessionDate)
  ) {
    const dateStr = rescheduleRequest.newDatesOptions.join(", ")

    throw new AppError(
      400,
      `please provide date that in the range or the reschedule request in: ${dateStr}`
    )
  }
  const updatedRequest = await updateRescheduleRequestService({
    requestId,
    status,
    newDate,
  })
  if (status === RescheduleRequestStatus.DECLINED) {
    return updatedRequest
  }
  // update session
  const updatedSession = await updateSessionService({
    sessionId: rescheduleRequest.sessionId,
    updatedData: {
      sessionDate: rescheduleRequest.newDate,
      sessionStartTime: rescheduleRequest.newDate.toUTCString().split("T")[1],
      teacherAttended: false,
      userAttended: false,
      meetingLink: null,
    } as any,
  })
  return updatedSession as Session
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
function datesMatch(d1: Date, d2: Date) {
  return d1.getTime() === d2.getTime()
}
