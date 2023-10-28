import { FindOptions } from "sequelize"
import { sequelize } from "../db"
import moment from "moment"
import Session, { SessionType } from "../db/models/session.model"
import { SessionStatus } from "../db/models/session.model"
import AppError from "../utils/AppError"
import {
  createModelService,
  getAllModelsByService,
  getModelByIdService,
  getModelsService,
  getOneModelByService,
  updateModelService,
} from "./factory.services"
import { createSessionService } from "./session.service"
import User from "../db/models/user.model"
import FreeSessionReq from "../db/models/sessionReq.model"
import { getUserByIdService, updateUserService } from "./user.service"
import {
  FREE_SESSION_DURATION,
  FREE_SESSION_TOPIC,
  checkPreviousFreeReq,
} from "./sessionReq.service"
async function requestFreeSessionService({
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
async function getOneFreeSessionReqService({
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
async function getAvailableFreeSessionsReq() {
  const sessions = await getAllModelsByService({
    Model: FreeSessionReq,
    findOptions: {
      where: { status: SessionStatus.PENDING },
      include: { model: User, attributes: ["fName", "lName"] },
    },
  })
  if (!sessions) {
    throw new AppError(400, "Can't get all available sessions requests service")
  }
  return sessions
}
async function getAllFreeSessionsReqService() {
  const sessions = await getAllModelsByService({
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
async function updateFreeSessionReqStatusService({
  id,
  status,
}: {
  id: number
  status: SessionStatus
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
async function updateSessionStatusService({
  id,
  status,
}: {
  id: number
  status: SessionStatus
}) {
  const freeSession = await updateModelService({
    ModelClass: Session,
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
async function getAllFreeSessionsService({
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
async function createFreeSessionService({
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
  // const session = await createSessionService({
  //   userId,
  //   teacherId,
  //   date,
  //   duration: FREE_SESSION_DURATION,
  //   type: SessionType.FREE,
  //   topic: FREE_SESSION_TOPIC,
  // })
  // if (!session) {
  //   throw new AppError(400, "Can't create the free session!")
  // }
  // const freeSession = await createModelService({
  //   ModelClass: Session,
  //   data: { sessionReqId: reqId, sessionId: session.id },
  // })
  // return { freeSession, session }
}

async function acceptAndCreateFreeSessionService({
  freeSessionReqId,
  teacherId,
}: {
  freeSessionReqId: number
  teacherId: string
}) {
  const freeSessionReq = (await getOneFreeSessionReqService({
    id: freeSessionReqId,
  })) as FreeSessionReq

  // await checkUniqueUserAndTeacher({ teacherId, userId: freeSessionReq.userId })

  const date = moment(freeSessionReq.date)
    .format("YYYY-MM-DD HH:MM:SS")
    .toString()

  // const { session, freeSession } = await createFreeSessionService({
  //   userId: freeSessionReq.userId,
  //   teacherId: teacherId,
  //   reqId: freeSessionReq.id,
  //   date: date,
  // })
  // await updateFreeSessionReqStatusService({
  //   id: freeSessionReq.id,
  //   status: SessionStatus.TAKEN,
  // })
  // return { session, freeSession }
}
