import { FindOptions } from "sequelize"
import Session, { SessionStatus, SessionType } from "../db/models/session.model"
import SessionReq from "../db/models/sessionReq.model"
import AppError from "../utils/AppError"
import {
  createModelService,
  deleteModelService,
  getAllModelsByService,
  getModelByIdService,
  getOneModelByService,
  updateModelService,
} from "./factory.services"
import { getUserByIdService } from "./user.service"
import { createSessionService } from "./session.service"
import moment from "moment"
export const DATE_PATTERN: RegExp = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/
export const FREE_SESSION_TOPIC = "User Free Session"
export const FREE_SESSION_DURATION = 20 // 20 min
export interface ICreateReq {
  userId: string
  date: string
  type: SessionType
}

export interface IUpdateReq {
  date: string
  status: SessionType
}
export async function createSessionRequestService({
  body,
}: {
  body: ICreateReq
}) {
  if (!DATE_PATTERN.test(body.date)) {
    const errorMessage =
      "Input does not match the pattern. Please use the format 'YYYY-MM-DD HH:MM:SS'"
    throw new AppError(400, errorMessage)
  }
  const sessionReq = await createModelService({
    ModelClass: SessionReq,
    data: body,
  })
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
  const req = (await getModelByIdService({
    ModelClass: SessionReq,
    Id: id,
    findOptions,
  })) as SessionReq
  return req
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
  duration,
  topic,
}: {
  sessionReqId: number
  teacherId: string
  duration: number
  topic: string
}) {
  const sessionReq = (await getOneSessionRequestService({
    id: sessionReqId,
  })) as SessionReq
  await checkUniqueUserAndTeacher({ teacherId, userId: sessionReq.userId })
  const date = moment(sessionReq.date).format("YYYY-MM-DD HH:MM:SS").toString()
  const session = await createSessionService({
    userId: sessionReq.userId,
    teacherId,
    date,
    duration,
    type: sessionReq.type,
    topic,
    sessionReqId: sessionReq.id,
  })
  if (!session) {
    throw new AppError(400, "Can't create the free session!")
  }
  return session
}
export async function updateSessionRequestService({
  id,
  updateBody,
}: {
  id: number
  updateBody: IUpdateReq
}) {
  const updatedReq = await updateModelService({
    ModelClass: SessionReq,
    id,
    updatedData: updateBody,
  })
  return updatedReq
}
export async function deleteSessionRequestService({ id }: { id: number }) {
  await deleteModelService({ ModelClass: SessionReq, id })
}
export async function checkPreviousFreeReq({ userId }: { userId: string }) {
  const sessionFreeReq = await getOneModelByService({
    Model: SessionReq,
    findOptions: {
      where: { userId, status: SessionStatus.PENDING, type: SessionType.FREE },
    },
  })
  if (sessionFreeReq) {
    throw new AppError(
      400,
      "Can't request new session, finish the previous one first "
    )
  }
  const user = await getUserByIdService({ userId })
  if (user!.availableFreeSession == 0) {
    throw new AppError(
      400,
      "you finished your available free session subscribe to get more!"
    )
  }
}
async function checkUniqueUserAndTeacher({
  teacherId,
  userId,
}: {
  teacherId: string
  userId: string
}) {
  const session = await getOneModelByService({
    Model: Session,
    findOptions: { where: { userId, teacherId } },
  })
  if (session) {
    throw new AppError(
      400,
      "The User and Teacher together had free session before"
    )
  }
}
