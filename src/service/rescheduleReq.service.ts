import { FindOptions, Op, Transaction, WhereOptions } from "sequelize"
import RescheduleRequest, {
  RescheduleRequestStatus,
} from "../db/models/rescheduleReq.model"
import AppError from "../utils/AppError"
import { updateModelService } from "./factory.services"
import {
  getOneSessionDetailsService,
  getTeacherAllSessionsService,
  getUserAllSessionsService,
  teacherOwnThisSession,
  updateSessionService,
  userOwnThisSession,
} from "./session.service"
import Session from "../db/models/session.model"
import SessionInfo from "../db/models/sessionInfo.model"
import User from "../db/models/user.model"
import {
  getTeacherSessionInfoService,
  getUserSessionInfoService,
} from "./sessionInfo.service"
import { getUserAttr } from "../controller/user.controller"
import { scheduleSessionRescheduleRequestUpdateMailJob } from "../utils/scheduler"

export async function createRescheduleRequestService({
  sessionId,
  newDate,
  oldDate,
}: {
  sessionId: number
  newDate: Date
  oldDate: Date
}) {
  const reqBody = {
    sessionId: sessionId,
    oldDate: oldDate,
    newDate: newDate,
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
export async function getOneRescheduleRequestServiceWithUserDetails({
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
  transaction,
}: {
  requestId: number
  status: RescheduleRequestStatus
  transaction?: Transaction
}) {
  const updatedRequest = await updateModelService({
    ModelClass: RescheduleRequest,
    id: requestId,
    updatedData: { status },
    transaction,
  })
  return updatedRequest
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
export async function requestRescheduleService({
  sessionId,
  userId,
  newDate,
}: {
  sessionId: number
  userId: string
  newDate: Date
}) {
  const { session, exist } = await userOwnThisSession({ userId, sessionId })
  if (!exist) {
    throw new AppError(
      401,
      "can't request reschedule for session that is not yours"
    )
  }
  const rescheduleRequest = createRescheduleRequestService({
    sessionId,
    newDate,
    oldDate: session.sessionDate,
  })
  return rescheduleRequest
}
export async function acceptOrDeclineRescheduleRequestService({
  requestId,
  teacherId,
  status,
}: {
  requestId: number
  teacherId: string
  status: RescheduleRequestStatus
}) {
  const rescheduleRequest = await getOneRescheduleRequestService({
    id: requestId,
  })
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
  const updatedRequest = await updateRescheduleRequestService({
    requestId,
    status,
  })
  if (status === RescheduleRequestStatus.DECLINED) {
    return updatedRequest
  }
  // update session
  const updatedSession = await updateSessionService({
    sessionId: rescheduleRequest.sessionId,
    updatedData: {
      sessionDate: rescheduleRequest.newDate,
      teacherAttended: false,
      userAttended: false,
      meetingLink: null,
    } as any,
  })
  return updatedSession as Session
}
export async function getPendingRequestBySessionId({
  sessionId,
}: {
  sessionId: number
}) {
  const request = await RescheduleRequest.findOne({
    where: { sessionId, status: RescheduleRequestStatus.PENDING },
  })
  return request
}
export async function getUserRescheduleRequests({
  userId,
}: {
  userId: string
}) {
  const sessionsObj = await getUserAllSessionsService({ userId })
  const sessionsIds: number[] = Object.values(sessionsObj)
    .flatMap((session) => session)
    .map((session) => session.id)
  const rescheduleRequests = await RescheduleRequest.findAll({
    where: { sessionId: { [Op.in]: sessionsIds } },
  })
  return rescheduleRequests
}
export async function getTeacherRescheduleRequests({
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
  let limit
  let offset
  if (pageSize) limit = pageSize
  if (page && pageSize) offset = page * pageSize
  const sessionsObj = await getTeacherAllSessionsService({ teacherId })
  const sessionsIds: number[] = Object.values(sessionsObj)
    .flatMap((session) => session)
    .map((session) => session.id)
  const where: WhereOptions = { sessionId: { [Op.in]: sessionsIds } }
  if (status) where.status = status

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
