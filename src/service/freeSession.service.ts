import { FindOptions } from "sequelize"
import { sequelize } from "../db"
import moment from "moment"
import Session, { SessionType } from "../db/models/session.model"
import FreeSession, { FreeSessionStatus } from "../db/models/sessionFree.model"
import AppError from "../utils/AppError"
import {
  createModelService,
  getModelByIdService,
  getModelByService,
  getModelsService,
  updateModelService,
} from "./factory.services"
import { createSessionService } from "./session.service"
import User from "../db/models/user.model"
import FreeSessionReq from "../db/models/sessionFreeReq.model"
import { getUserByIdService, updateUserService } from "./user.service"

const FREE_SESSION_TOPIC = "User Free Session"
const FREE_SESSION_DURATION = 20 // 20 min
export const DATE_PATTERN: RegExp = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/

export async function requestFreeSessionService({
  userId,
  date,
}: {
  userId: string
  date: Date
}) {
  // check if there is unfinished request sessions
  // and if the user had all his available sessions
  await checkPreviousFreeReq({ userId })

  const newFreeSessionReq = await createModelService({
    ModelClass: FreeSessionReq,
    data: { userId, date },
  })
  if (!newFreeSessionReq) {
    throw new AppError(400, "Can't create Free Session Request")
  }
  const user = await getUserByIdService({ userId })
  await user?.decrement("availableFreeSession")
  return newFreeSessionReq
}
export async function getOneFreeSessionReqService({
  id,
  findOptions,
}: {
  id: number
  findOptions?: FindOptions
}) {
  const session = await getModelByIdService({
    ModelClass: FreeSessionReq,
    Id: id,
    findOptions,
  })
  if (!session) {
    throw new AppError(400, "Can't find request session with this id!")
  }
  return session
}
export async function getAvailableFreeSessionsReq() {
  const sessions = await getModelByService({
    Model: FreeSessionReq,
    findOptions: {
      where: { status: FreeSessionStatus.PENDING },
      include: { model: User, attributes: ["fName", "lName"] },
    },
  })
  if (!sessions) {
    throw new AppError(400, "Can't get all available sessions requests service")
  }
  return sessions
}
export async function getAllFreeSessionsReqService() {
  const sessions = await getModelByService({
    Model: FreeSessionReq,
    findOptions: {
      include: { model: User, attributes: ["fName", "lName"] },
    },
  })
  if (!sessions) {
    throw new AppError(400, "Can't get all available sessions requests service")
  }
  return sessions
}
export async function updateFreeSessionReqStatusService({
  id,
  status,
}: {
  id: number
  status: FreeSessionStatus
}) {
  const freeSession = await updateModelService({
    ModelClass: FreeSessionReq,
    id,
    updatedData: { status },
  })
  if (!freeSession) {
    throw new AppError(
      400,
      "something wrong happened while updating the free session request"
    )
  }
  return freeSession
}
export async function updateFreeSessionStatusService({
  id,
  status,
}: {
  id: number
  status: FreeSessionStatus
}) {
  const freeSession = await updateModelService({
    ModelClass: FreeSession,
    id,
    updatedData: { status },
  })
  if (!freeSession) {
    throw new AppError(
      400,
      "something wrong happened while updating free session status"
    )
  }
  return freeSession
}
export async function getAllFreeSessionsService({
  findOptions,
}: {
  findOptions?: FindOptions
}) {
  // i used raw query because it was complicated to get it with include in sequelize
  const [sessions, metadata] =
    await sequelize.query(`select u."fName" , u."lName", f.* ,s.*
    from "freeSession" as f join "freeSessionRequest" sr 
    on f."sessionReqId" = sr.id
    join "user" u on sr."userId" = u.id
	join "session" s on f."sessionId" = s.id`)
  if (!sessions) {
    throw new AppError(400, "Can't get all sessions service")
  }
  return sessions
}
// this function called after the teacher accepted request and made team!
export async function createFreeSessionService({
  userId,
  teacherId,
  reqId,
  date,
}: {
  userId: string
  teacherId: string
  reqId: number
  date: string
}) {
  const session = await createSessionService({
    userId,
    teacherId,
    date,
    duration: FREE_SESSION_DURATION,
    type: SessionType.FREE,
    topic: FREE_SESSION_TOPIC,
  })
  if (!session) {
    throw new AppError(400, "Can't create the free session!")
  }
  const freeSession = await createModelService({
    ModelClass: FreeSession,
    data: { sessionReqId: reqId, sessionId: session.id },
  })
  return { freeSession, session }
}

export async function acceptAndCreateFreeSessionService({
  freeSessionReqId,
  teacherId,
}: {
  freeSessionReqId: number
  teacherId: string
}) {
  const freeSessionReq = (await getOneFreeSessionReqService({
    id: freeSessionReqId,
  })) as FreeSessionReq

  await checkUniqueUserAndTeacher({ teacherId, userId: freeSessionReq.userId })

  const date = moment(freeSessionReq.date)
    .format("YYYY-MM-DD HH:MM:SS")
    .toString()

  const { session, freeSession } = await createFreeSessionService({
    userId: freeSessionReq.userId,
    teacherId: teacherId,
    reqId: freeSessionReq.id,
    date: date,
  })
  await updateFreeSessionReqStatusService({
    id: freeSessionReq.id,
    status: FreeSessionStatus.TAKEN,
  })
  return { session, freeSession }
}

async function checkUniqueUserAndTeacher({
  teacherId,
  userId,
}: {
  teacherId: string
  userId: string
}) {
  const session = await getModelByService({
    Model: Session,
    findOptions: { where: { userId, teacherId } },
  })
  if (session.length > 0) {
    throw new AppError(
      400,
      "The User and Teacher together had free session before"
    )
  }
}

async function checkPreviousFreeReq({ userId }: { userId: string }) {
  const sessionFreeReq = await getModelByService({
    Model: FreeSessionReq,
    findOptions: { where: { userId, status: FreeSessionStatus.PENDING } },
  })
  if (sessionFreeReq.length > 0) {
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
