import { FindOptions } from "sequelize"
import Session, { SessionType } from "../db/models/session.model"
import AppError from "../utils/AppError"
import {
  createModelService,
  deleteModelService,
  getModelByIdService,
  getModelsService,
  updateModelService,
} from "./factory.services"
import { DATE_PATTERN } from "./freeSession.service"
import ZoomService from "../connect/zoom"
interface sessionBody {
  teamId: number
  sessionDate: Date
  sessionDuration: number
  meetingLink: string
  type: string
}
export async function createSessionService({
  userId,
  teacherId,
  date,
  type,
  topic,
  duration,
}: {
  userId: string
  teacherId: string
  date: string
  type: SessionType
  topic: string
  duration: number
}) {
  if (!DATE_PATTERN.test(date)) {
    const errorMessage =
      "Input does not match the pattern. Please use the format 'YYYY-MM-DD HH:MM:SS'"
    throw new AppError(400, errorMessage)
  }
  const sessionDate = new Date(date)
  const start_date = new Date(date).toISOString().split("T")[0]
  const start_time = new Date(date).toISOString().split("T")[1]
  const meetingLink = await new ZoomService().createMeeting({
    topic,
    duration,
    start_date,
    start_time,
  })

  const body = {
    userId,
    teacherId,
    sessionDate,
    sessionDuration: duration,
    meetingLink,
    type,
  }
  const session = await createModelService({ ModelClass: Session, data: body })
  if (!session) {
    throw new AppError(400, "Can't create session!")
  }
  return session
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

export async function deleteSessionService({ id }: { id: string | number }) {
  await deleteModelService({ ModelClass: Session, id })
}

export async function getAllSessions({
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

export async function getSession({
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
