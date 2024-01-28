import { FindOptions, Op, Transaction, WhereOptions } from "sequelize";
import RescheduleRequest, {
  RescheduleRequestStatus,
} from "../db/models/rescheduleReq.model";
import AppError from "../utils/AppError";
import { updateModelService } from "./factory.services";
import {
  OrderAssociation,
  getTeacherAllSessionsService,
  getUserAllSessionsService,
  teacherOwnThisSession,
  userOwnThisSession,
} from "./session.service";
import Session from "../db/models/session.model";
import SessionInfo from "../db/models/sessionInfo.model";
import User from "../db/models/user.model";
import { getUserAttr } from "../controller/user.controller";
import Teacher, { RoleType } from "../db/models/teacher.model";
import { getTeacherAtt } from "../controller/teacher.controller";
import logger from "../utils/logger";

export async function createRescheduleRequestService({
  sessionId,
  newDatesOptions,
  oldDate,
  requestedBy,
  transaction,
}: {
  sessionId: number;
  newDatesOptions: Date[];
  oldDate: Date;
  requestedBy: RoleType;
  transaction?: Transaction;
}) {
  const dateArr = newDatesOptions.map((str) => new Date(str));

  const reqBody = {
    sessionId,
    oldDate,
    newDatesOptions: dateArr,
    requestedBy,
  };
  const rescheduleRequest = await RescheduleRequest.create(reqBody as any, {
    transaction,
  });
  if (!rescheduleRequest) {
    throw new AppError(400, "can't create reschedule request!");
  }
  return rescheduleRequest;
}
export async function getOneRescheduleRequestService({ id }: { id: number }) {
  const request = await RescheduleRequest.findByPk(id);
  if (!request) {
    throw new AppError(404, "there is no request with this id!");
  }
  return request;
}
export async function getOneRescheduleRequestServiceWithUserDetailsService({
  requestId,
}: {
  requestId: number;
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
  });
  if (!request) {
    throw new AppError(404, "Can't find reschedule request with this id!");
  }
  return request;
}
export async function updateRescheduleRequestService({
  requestId,
  status,
  newDate,
  transaction,
}: {
  requestId: number;
  status: RescheduleRequestStatus;
  newDate?: Date;
  transaction?: Transaction;
}) {
  const reqBody: any = { status };
  if (newDate) {
    reqBody.newDate = newDate;
  }
  const updatedRequest = await updateModelService({
    ModelClass: RescheduleRequest,
    id: requestId,
    updatedData: reqBody,
    transaction,
  });
  return updatedRequest as RescheduleRequest;
}
export async function getAllRescheduleRequestsService({
  findOptions,
}: {
  findOptions?: FindOptions;
}) {
  const requests = await RescheduleRequest.findAll(findOptions);
  return requests;
}
export async function deleteRescheduleRequestService({
  requestId,
}: {
  requestId: number;
}) {
  await RescheduleRequest.destroy({ where: { id: requestId } });
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
  });
}
export async function userRequestRescheduleService({
  sessionId,
  userId,
  newDatesOptions,
  transaction,
}: {
  sessionId: number;
  userId: string;
  newDatesOptions: Date[];
  transaction?: Transaction;
}) {
  const { session, exist } = await userOwnThisSession({ userId, sessionId });
  if (!exist) {
    throw new AppError(
      403,
      "Can't request session reschedule for session that is not yours!",
    );
  }
  const rescheduleRequest = createRescheduleRequestService({
    sessionId,
    newDatesOptions,
    oldDate: session!.sessionDate,
    requestedBy: RoleType.USER,
    transaction,
  });
  return rescheduleRequest;
}
export async function teacherRequestRescheduleService({
  sessionId,
  teacherId,
  newDatesOptions,
  transaction,
}: {
  sessionId: number;
  teacherId: string;
  newDatesOptions: Date[];
  transaction?: Transaction;
}) {
  logger.info({ here: teacherId, sessionId });
  const { session, exist } = await teacherOwnThisSession({
    teacherId,
    sessionId,
  });
  if (!exist) {
    throw new AppError(
      403,
      "Can't request session reschedule for session that is not yours!",
    );
  }
  const rescheduleRequest = createRescheduleRequestService({
    sessionId,
    newDatesOptions,
    oldDate: session!.sessionDate,
    requestedBy: RoleType.TEACHER,
    transaction,
  });
  return rescheduleRequest;
}

export async function getPendingRequestBySessionIdService({
  sessionId,
}: {
  sessionId: number;
}) {
  const request = await RescheduleRequest.findOne({
    where: { sessionId, status: RescheduleRequestStatus.PENDING },
  });
  return request;
}
export async function getUserAllRescheduleRequestsService({
  userId,
  limit,
  offset,
  status,
  requestedBy,
}: {
  userId: string;
  offset?: number;
  limit?: number;
  status?: RescheduleRequestStatus;
  requestedBy?: RoleType;
}) {
  const result = await getUserAllSessionsService({
    userId,
    orderAssociation: OrderAssociation.ASC,
  });
  if (!result) {
    throw new AppError(400, "can't get this user Sessions");
  }
  const sessionsIds: number[] = result.rows.map((session) => session.id);
  const where: WhereOptions = { sessionId: { [Op.in]: sessionsIds } };
  if (status) where.status = status;
  if (requestedBy) where.requestedBy = requestedBy;
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
  });
  return rescheduleRequests;
}
export async function getUserReceivedRescheduleRequestsService({
  userId,
  limit,
  offset,
  status,
}: {
  userId: string;
  limit?: number;
  offset?: number;
  status?: RescheduleRequestStatus;
}) {
  return getUserAllRescheduleRequestsService({
    userId,
    requestedBy: RoleType.TEACHER,
    limit,
    offset,
    status,
  });
}
export async function getUserRescheduleRequestsService({
  userId,
  limit,
  offset,
  status,
}: {
  userId: string;
  limit?: number;
  offset?: number;
  status?: RescheduleRequestStatus;
}) {
  return getUserAllRescheduleRequestsService({
    limit,
    offset,
    status,
    userId,
    requestedBy: RoleType.USER,
  });
}
export async function getTeacherAllRescheduleRequestsService({
  teacherId,
  limit,
  offset,
  status,
  requestedBy,
}: {
  teacherId: string;
  limit?: number;
  offset?: number;
  status?: RescheduleRequestStatus;
  requestedBy?: RoleType;
}) {
  const result = await getTeacherAllSessionsService({ teacherId });
  if (!result) {
    throw new AppError(400, "can't get this teacher Sessions");
  }
  const sessionsIds: number[] = result.rows.map((session) => session.id);
  const where: WhereOptions = { sessionId: { [Op.in]: sessionsIds } };
  if (status) where.status = status;
  if (requestedBy) where.requestedBy = requestedBy;
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
  });
  return rescheduleRequests;
}
export async function getTeacherReceivedRescheduleRequestsService({
  teacherId,
  limit,
  offset,
  status,
}: {
  teacherId: string;
  limit?: number;
  offset?: number;
  status?: RescheduleRequestStatus;
}) {
  return getTeacherAllRescheduleRequestsService({
    teacherId,
    requestedBy: RoleType.USER,
    limit,
    offset,
    status,
  });
}
export async function getTeacherRescheduleRequestsService({
  teacherId,
  limit,
  offset,
  status,
}: {
  teacherId: string;
  limit?: number;
  offset?: number;
  status?: RescheduleRequestStatus;
}) {
  return getTeacherAllRescheduleRequestsService({
    teacherId,
    requestedBy: RoleType.TEACHER,
    limit,
    offset,
    status,
  });
}
export function datesMatch(d1: Date, d2: Date) {
  return d1.getTime() === d2.getTime();
}
