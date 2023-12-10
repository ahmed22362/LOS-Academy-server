import { Server, Socket } from "socket.io"
import http from "http"
import { verifyToken } from "../utils/jwt"
import logger from "../utils/logger"

const socketUserMap = new Map<string, Socket>()
export const socketEventsName = {
  ONGOING_SESSION: "ongoing_session",
  FINISHED_SESSION: "finished_session",
  SESSION_RESCHEDULED_REQUESTED: "reschedule_request",
  SESSION_REQUESTED: "session_requested",
  REPORT_ADDED: "report_added",
}
export interface socketWithUser extends Socket {
  userId?: string
}
export const setupSocket = (server: http.Server) => {
  const io = new Server(server, {
    cors: {
      origin: [/http:\/\/localhost:\d*/, "*"],
    },
  })
  io.use(async (socket: socketWithUser, next) => {
    try {
      const token = socket.handshake.auth.token
      const user = await verifyToken(token)
      socketUserMap.set(user.id, socket)
      socket.userId = user.id
      next()
    } catch (error: any) {
      logger.error(error.message)
      // next(error)
    }
  })
  io.on("connection", async (socket: socketWithUser) => {
    console.log("A user connected:", socket.id, socket.userId)
    socket.on("disconnect", () => {
      console.log("A user disconnected:", socket.id, socket.userId)
      socketUserMap.delete(socket.userId!)
    })
  })
  io.engine.on("pingTimeout", (socket) => {
    socketUserMap.delete(socket.userId)
  })

  io.on("error", (error) => {
    logger.error(error)
  })
  return io
}

export const getSocketByUserId = (userId: string): Socket | undefined => {
  return socketUserMap.get(userId)
}
export const emitEventForUser = ({
  userId,
  eventName,
  payload,
}: {
  userId: string
  eventName: string
  payload?: Object
}) => {
  const studentSocket = getSocketByUserId(userId)
  if (!studentSocket) {
    logger.error("Can't find user socket!")
  }
  studentSocket?.emit(eventName, payload)
  if (studentSocket) {
    logger.info(`event ${eventName} has been fired!`)
  }
}
export function emitSessionOngoingForUser(userId: string, payload?: object) {
  emitEventForUser({
    userId,
    eventName: socketEventsName.ONGOING_SESSION,
    payload,
  })
}
export function emitSessionFinishedForUser(userId: string, payload?: object) {
  emitEventForUser({
    userId,
    eventName: socketEventsName.FINISHED_SESSION,
    payload,
  })
}
export function emitReportAddedForUser(userId: string, payload?: object) {
  emitEventForUser({
    userId,
    eventName: socketEventsName.REPORT_ADDED,
    payload,
  })
}
export function emitRescheduleRequestForUser(userId: string, payload?: object) {
  emitEventForUser({
    userId,
    eventName: socketEventsName.SESSION_RESCHEDULED_REQUESTED,
    payload,
  })
}
export function emitSessionRequestForTeacher(
  teacherId: string,
  payload?: object
) {
  emitEventForUser({
    userId: teacherId,
    eventName: socketEventsName.SESSION_REQUESTED,
    payload,
  })
}
