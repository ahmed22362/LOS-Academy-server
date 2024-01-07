import { Server, Socket } from "socket.io";
import http from "http";
import { verifyToken } from "../utils/jwt";
import logger from "../utils/logger";
import { getTeacherByService } from "../service/teacher.service";

const socketUserMap = new Map<string, Socket>();
export const socketEventsName = {
  ONGOING_SESSION: "ongoing_session",
  FINISHED_SESSION: "finished_session",
  SESSION_RESCHEDULED_REQUESTED: "reschedule_request",
  SESSION_REQUESTED: "session_requested",
  REPORT_ADDED: "report_added",
  TEACHERS_ROOM: "teachers_room",
};
export interface socketWithUser extends Socket {
  userId?: string;
}
export const setupSocket = (server: http.Server) => {
  const io = new Server(server, {
    cors: {
      origin: [/http:\/\/localhost:\d*/, "https://los-academy.vercel.app"],
    },
  });
  io.use(async (socket: socketWithUser, next) => {
    try {
      const token = socket.handshake.auth.token;
      const user = await verifyToken(token);
      socketUserMap.set(user.id, socket);
      socket.userId = user.id;
      const teacher = await getTeacherByService({
        findOptions: { where: { id: user.id } },
      });
      if (teacher) {
        logger.info(`teacher: ${teacher.id} has joined the room!`);
        socket.join(socketEventsName.TEACHERS_ROOM);
      }
      next();
    } catch (error: any) {
      logger.error(error.message);
    }
  });
  io.on("connection", async (socket: socketWithUser) => {
    console.log("A user connected:", socket.id, socket.userId);
    socket.emit("event", { hello: "world" });
    socket.on("disconnect", () => {
      console.log("A user disconnected:", socket.id, socket.userId);
      socketUserMap.delete(socket.userId!);
    });
  });
  io.engine.on("pingTimeout", (socket) => {
    socketUserMap.delete(socket.userId);
  });

  io.on("error", (error) => {
    logger.error(error);
  });
  return io;
};

export const getSocketByUserId = (userId: string): Socket | undefined => {
  return socketUserMap.get(userId);
};
export const emitEventForUser = ({
  userId,
  eventName,
  payload,
}: {
  userId: string;
  eventName: string;
  payload?: Object;
}) => {
  const userSocket = getSocketByUserId(userId);
  if (!userSocket) {
    logger.error("Can't find user socket!");
  }
  userSocket?.emit(eventName, payload);
  if (userSocket) {
    logger.info(`event ${eventName} has been fired!`);
  }
};
export function emitSessionOngoingForUser(userId: string, payload?: object) {
  emitEventForUser({
    userId,
    eventName: socketEventsName.ONGOING_SESSION,
    payload,
  });
}
export function emitSessionFinishedForUser(userId: string, payload?: object) {
  emitEventForUser({
    userId,
    eventName: socketEventsName.FINISHED_SESSION,
    payload,
  });
}
export function emitReportAddedForUser(userId: string, payload?: object) {
  emitEventForUser({
    userId,
    eventName: socketEventsName.REPORT_ADDED,
    payload,
  });
}
export function emitRescheduleRequestForUser(userId: string, payload?: object) {
  emitEventForUser({
    userId,
    eventName: socketEventsName.SESSION_RESCHEDULED_REQUESTED,
    payload,
  });
}
export function emitSessionRequestForTeachers(
  socket: Socket,
  payload?: object,
) {
  if (socket) {
    socket
      .to(socketEventsName.TEACHERS_ROOM)
      .emit(socketEventsName.SESSION_REQUESTED, payload);
    logger.info(
      `${socketEventsName.SESSION_REQUESTED} event emitted for room: ${socketEventsName.TEACHERS_ROOM}`,
    );
  }
}
