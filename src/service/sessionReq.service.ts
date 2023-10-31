import { FindOptions, Transaction } from "sequelize"
import { SessionStatus, SessionType } from "../db/models/session.model"
import SessionReq from "../db/models/sessionReq.model"
import AppError from "../utils/AppError"
import {
  createModelService,
  deleteModelService,
  getAllModelsByService,
  getModelByIdService,
  getOneModelByService,
} from "./factory.services"
import { getUserByIdService, getUserSubscriptionPlan } from "./user.service"
import {
  createFreeSessionService,
  createPaidSessionsService,
} from "./session.service"
import { checkUniqueUserAndTeacher } from "./sessionInfo.service"
import { sequelize } from "../db/sequalize"
export const DATE_PATTERN: RegExp = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/
export const FREE_SESSION_TOPIC = "User Free Session"
export const FREE_SESSION_DURATION = 20 // 20 min
export interface ICreateReq {
  userId: string
  sessionDates: Date[]
  type: SessionType
  sessionStartTime?: string
}

export interface IUpdateReq {
  sessionDates: Date[]
  status: SessionStatus
  sessionStartTime: string
}
export async function createSessionRequestService({
  body,
  transaction,
}: {
  body: ICreateReq
  transaction?: Transaction
}) {
  body.sessionStartTime = body.sessionDates[0].toISOString().split("T")[1] // select only the time
  const sessionReq = await SessionReq.create(body as any, { transaction })
  if (!sessionReq) {
    throw new AppError(400, "Error Creating Request!")
  }
  return sessionReq
}
export async function getOneSessionRequestService({
  id,
  findOptions,
}: {
  id: number
  findOptions?: FindOptions
}) {
  const req = await getModelByIdService({
    ModelClass: SessionReq,
    Id: id,
    findOptions,
  })
  if (!req) {
    throw new AppError(404, "there is no request with this id!")
  }
  return req as SessionReq
}
export async function getAllSessionsRequestService({
  findOptions,
}: {
  findOptions?: FindOptions
}) {
  const requests = await getAllModelsByService({
    Model: SessionReq,
    findOptions,
  })
  return requests
}

export async function acceptSessionRequestService({
  sessionReqId,
  teacherId,
}: {
  sessionReqId: number
  teacherId: string
}) {
  const sessionReq = await getOneSessionRequestService({
    id: sessionReqId,
  })
  const userId = sessionReq.userId
  await checkUniqueUserAndTeacher({ teacherId, userId })
  if (sessionReq.type === SessionType.FREE) {
    const t = await sequelize.transaction()
    try {
      const firstDate = sessionReq.sessionDates[0]
      const freeSession = await createFreeSessionService({
        userId,
        teacherId,
        sessionDate: firstDate,
        sessionReqId,
        transaction: t,
      })
      await updateSessionRequestService({
        id: sessionReqId,
        updateBody: { status: SessionStatus.TAKEN },
        transaction: t,
      })
      await t.commit()
      return freeSession
    } catch (error: any) {
      await t.rollback()
      throw new AppError(400, `Error Request free session ${error.message}`)
    }
  } else if (sessionReq.type === SessionType.PAID) {
    const subscribePlan = await getUserSubscriptionPlan({
      userId: sessionReq.userId,
    })
    const t = await sequelize.transaction()
    try {
      const paidSessions = await createPaidSessionsService({
        userId,
        teacherId,
        sessionDates: sessionReq.sessionDates,
        sessionReqId,
        sessionCount: subscribePlan.plan.sessionsCount,
        sessionDuration: subscribePlan.plan.sessionDuration,
        sessionsPerWeek: subscribePlan.plan.sessionsPerWeek,
        transaction: t,
      })
      await updateSessionRequestService({
        id: sessionReqId,
        updateBody: { status: SessionStatus.TAKEN },
        transaction: t,
      })
      await t.commit()
      return paidSessions
    } catch (error: any) {
      await t.rollback()
      throw new AppError(
        400,
        `Error While request paid session ${error.message}`
      )
    }
  } else {
    throw new AppError(400, "Can't define the type of the session!")
  }
}
export async function updateSessionRequestService({
  id,
  updateBody,
  transaction,
}: {
  id: number
  updateBody: Partial<IUpdateReq>
  transaction?: Transaction
}) {
  const updatedReq = await SessionReq.update(updateBody, {
    where: { id },
    transaction,
    returning: true,
  })
  return updatedReq[1]
}
export async function deleteSessionRequestService({ id }: { id: number }) {
  await deleteModelService({ ModelClass: SessionReq, id })
}
export async function checkPreviousReq({
  userId,
  type,
}: {
  userId: string
  type: SessionType
}) {
  const sessionReq = await getOneModelByService({
    Model: SessionReq,
    findOptions: {
      where: { userId, status: SessionStatus.PENDING, type },
    },
  })
  if (sessionReq) {
    throw new AppError(
      400,
      "Can't request new session, finish the previous one first or update the date if there is no teacher accept it! "
    )
  }
  if (type === SessionType.FREE) {
    const user = await getUserByIdService({ userId })
    if (user!.availableFreeSession == 0) {
      throw new AppError(
        400,
        "you finished your available free session subscribe to get more!"
      )
    }
  }
}
