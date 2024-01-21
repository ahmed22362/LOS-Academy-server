import { FindOptions, Transaction } from "sequelize";
import { SessionStatus, SessionType } from "../db/models/session.model";
import SessionReq from "../db/models/sessionReq.model";
import AppError from "../utils/AppError";
import {
  deleteModelService,
  getAllModelsByService,
  getModelByIdService,
  getOneModelByService,
} from "./factory.services";
import {
  getUserByIdService,
  getUserSubscriptionPlan,
  updateUserService,
} from "./user.service";
import {
  createFreeSessionService,
  createPaidSessionsService,
  isTeacherHasOverlappingSessions,
} from "./session.service";
import {
  checkUniqueUserAndTeacher,
  createSessionInfoService,
  updateSessionInfoService,
} from "./sessionInfo.service";
import { sequelize } from "../db/sequelize";
import logger from "../utils/logger";
import { getTeacherByIdService } from "./teacher.service";
export const DATE_PATTERN: RegExp =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/;
export const FREE_SESSION_TOPIC = "User Free Session";
export const FREE_SESSION_DURATION = 25; // 20 min
export interface ICreateReq {
  userId: string;
  sessionDates: Date[];
  type: SessionType;
  courses: string[];
}

export interface IUpdateReq {
  sessionDates?: Date[];
  status?: SessionStatus;
  courses?: string[];
}
export async function createSessionRequestService({
  body,
  transaction,
}: {
  body: ICreateReq;
  transaction?: Transaction;
}) {
  const sessionReq = await SessionReq.create(body as any, { transaction });
  if (!sessionReq) {
    throw new AppError(400, "Error Creating Request!");
  }
  return sessionReq;
}
export async function getOneSessionRequestService({
  id,
  findOptions,
}: {
  id: number;
  findOptions?: FindOptions;
}) {
  const req = await getModelByIdService({
    ModelClass: SessionReq,
    Id: id,
    findOptions,
  });
  if (!req) {
    throw new AppError(404, "there is no request with this id!");
  }
  return req as SessionReq;
}
export async function getAllSessionsRequestService({
  findOptions,
}: {
  findOptions?: FindOptions;
}) {
  const requests = await getAllModelsByService({
    Model: SessionReq,
    findOptions,
  });
  return requests;
}
export async function getUserSessionRequestService({
  userId,
}: {
  userId: string;
}) {
  const requests = await SessionReq.findAll({ where: { userId } });
  if (!requests) {
    throw new AppError(400, "Error getting user requests!");
  }
  return requests;
}
export async function acceptSessionRequestService({
  sessionReqId,
  teacherId,
}: {
  sessionReqId: number;
  teacherId: string;
}) {
  const sessionReq = await getOneSessionRequestService({
    id: sessionReqId,
  });
  const userId = sessionReq.userId;
  await checkUniqueUserAndTeacher({ teacherId, userId });
  const user = await getUserByIdService({ userId });
  const teacher = await getTeacherByIdService({ id: teacherId });
  const t = await sequelize.transaction();
  try {
    const sessionInfo = await createSessionInfoService({
      userId,
      teacherId,
      transaction: t,
    });
    if (sessionReq.type === SessionType.FREE) {
      await isTeacherHasOverlappingSessions({
        teacherId,
        wantedSessionDates: sessionReq.sessionDates,
        wantedSessionDuration: FREE_SESSION_DURATION,
      });
      const firstDate = sessionReq.sessionDates[0];
      const freeSession = await createFreeSessionService({
        sessionInfoId: sessionInfo.id,
        sessionDate: firstDate,
        transaction: t,
        studentEmail: user.email,
        studentName: user.name,
        teacherEmail: teacher.email,
        teacherName: teacher.name,
      });
      await updateSessionRequestService({
        id: sessionReqId,
        updateBody: { status: SessionStatus.TAKEN },
        transaction: t,
      });
      await t.commit();
      return freeSession;
    } else if (sessionReq.type === SessionType.PAID) {
      const subscribePlan = await getUserSubscriptionPlan({
        userId: sessionReq.userId,
      });
      if (!subscribePlan) {
        throw new AppError(404, "There is no subscription for this user!");
      }
      await isTeacherHasOverlappingSessions({
        teacherId,
        wantedSessionDates: sessionReq.sessionDates,
        wantedSessionDuration: subscribePlan.plan.sessionDuration,
      });
      const paidSessions = await createPaidSessionsService({
        sessionInfoId: sessionInfo.id,
        sessionDates: sessionReq.sessionDates,
        sessionCount: subscribePlan.plan.sessionsCount,
        sessionDuration: subscribePlan.plan.sessionDuration,
        sessionsPerWeek: subscribePlan.plan.sessionsPerWeek,
        transaction: t,
        studentEmail: user.email,
        studentName: user.name,
        teacherEmail: teacher.email,
        teacherName: teacher.name,
      });
      await updateSessionRequestService({
        id: sessionReqId,
        updateBody: { status: SessionStatus.TAKEN },
        transaction: t,
      });
      await updateUserService({
        userId,
        updatedData: { sessionPlaced: true },
        transaction: t,
      });
      await updateSessionInfoService({
        id: sessionInfo.id,
        updatedData: { willContinue: true },
        transaction: t,
      });
      await t.commit();
      return paidSessions;
    } else {
      throw new AppError(400, "Can't define the type of the session!");
    }
  } catch (error: any) {
    await t.rollback();
    throw new AppError(
      400,
      `Error While request paid session ${error.message}`,
    );
  }
}
export async function updateSessionRequestService({
  id,
  updateBody,
  transaction,
}: {
  id: number;
  updateBody: Partial<IUpdateReq>;
  transaction?: Transaction;
}) {
  const updatedReq = await SessionReq.update(updateBody, {
    where: { id },
    transaction,
    returning: true,
  });
  return updatedReq[1];
}
export async function deleteSessionRequestService({ id }: { id: number }) {
  await deleteModelService({ ModelClass: SessionReq, id });
}
export async function checkPreviousReq({
  userId,
  type,
}: {
  userId: string;
  type: SessionType;
}) {
  const sessionReq = await getOneModelByService({
    Model: SessionReq,
    findOptions: {
      where: { userId, status: SessionStatus.PENDING, type },
    },
  });
  if (sessionReq) {
    throw new AppError(
      400,
      "Can't request new session, finish the previous one first or update the date if there is no teacher accept it! ",
    );
  }
  if (type === SessionType.FREE) {
    const user = await getUserByIdService({ userId });
    if (user!.availableFreeSession == 0) {
      throw new AppError(
        400,
        "you finished your available free session subscribe to get more!",
      );
    }
  }
}
