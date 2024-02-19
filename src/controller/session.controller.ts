import { NextFunction, Request, Response } from "express";
import catchAsync from "../utils/catchAsync";
import {
  canRescheduleSession,
  checkDateFormat,
  createFreeSessionService,
  createPaidSessionsService,
  deleteSessionService,
  getAdminSessionsStatisticsService,
  getAllSessionsService,
  getAllSessionsServiceByStatus,
  getOneSessionDetailsService,
  getOneSessionService,
  getOneSessionWithSessionInfoOnlyService,
  getUserLatestNotPendingSessionService,
  handleSessionFinishedService,
  isTeacherHasOverlappingSessions,
  teacherOwnThisSession,
  updateSessionService,
  updateSessionServiceWithUserAndTeacherBalance,
  updateSessionStatusService,
  updateSessionStudentAttendanceService,
  updateSessionTeacherAttendanceService,
  updateSessionsService,
  userOwnThisSession,
} from "../service/session.service";
import { sequelize } from "../db/sequelize";
import AppError from "../utils/AppError";
import { IRequestWithUser } from "./auth.controller";
import {
  datesMatch,
  getAllRescheduleRequestsService,
  getOneRescheduleRequestService,
  getPendingRequestBySessionIdService,
  teacherRequestRescheduleService,
  updateRescheduleRequestService,
  userRequestRescheduleService,
} from "../service/rescheduleReq.service";
import RescheduleRequest, {
  RescheduleRequestStatus,
} from "../db/models/rescheduleReq.model";
import Session, {
  SessionStatus,
  SessionType,
} from "../db/models/session.model";
import {
  getTeacherByIdService,
  updateTeacherBalance,
} from "../service/teacher.service";
import {
  checkUserSubscription,
  getUserByIdService,
  sessionPerWeekEqualDates,
  updateUserRemainSessionService,
  updateUserService,
} from "../service/user.service";
import SessionInfo from "../db/models/sessionInfo.model";
import User from "../db/models/user.model";
import { getPaginationParameter, getUserAttr } from "./user.controller";
import Teacher, { RoleType } from "../db/models/teacher.model";
import { getTeacherAtt } from "./teacher.controller";
import {
  rescheduleSessionJobs,
  scheduleSessionReminderMailJob,
  scheduleSessionRescheduleRequestMailJob,
  scheduleSessionRescheduleRequestStatus,
  scheduleSessionRescheduleRequestUpdateMailJob,
  scheduleSessionStartReminderMailJob,
  scheduleUpdateSessionToFinished,
  scheduleUpdateSessionToOngoing,
} from "../utils/scheduler";
import {
  createSessionInfoService,
  getAllSessionsInfoService,
  getOneSessionInfoServiceBy,
  getOrCreateSessionInfoService,
  getSessionInfoService,
  updateOneSessionInfoService,
} from "../service/sessionInfo.service";
import { deleteJobServiceWhere } from "../service/scheduleJob.service";
import { getRescheduleRequestJobName } from "../utils/processSchedulerJobs";
import { Transaction } from "sequelize";
import { SubscriptionStatus } from "../db/models/subscription.model";
import { emitRescheduleRequestForUser } from "../connect/socket";
import logger from "../utils/logger";
export const THREE_MINUTES_IN_MILLISECONDS = 3 * 60 * 1000;
export const HOUR_IN_MILLISECONDS = 60 * 60 * 1000;
const DEFAULT_COURSES = ["arabic"];
export const getAllSessions = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { nLimit, status, offset } = getPaginationParameter(req);
    const sessions = await getAllSessionsServiceByStatus({
      status: status as SessionStatus,
      offset,
      pageSize: nLimit,
    });
    res.status(200).json({
      status: "success",
      length: sessions.count,
      data: sessions.rows,
    });
  },
);
export const getAllSessionsByStatus = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { nLimit, status, offset } = getPaginationParameter(req);
    const userSearch = req.query.user;
    const teacherSearch = req.query.teacher;
    let searchQuery: { [key: string]: any } | undefined;

    if (userSearch || teacherSearch) {
      searchQuery = {
        user: userSearch as any,
        teacher: teacherSearch as any,
      };
    }
    const sessions = await getAllSessionsServiceByStatus({
      status: status as any,
      offset,
      pageSize: nLimit,
      searchQuery,
    });
    res.status(200).json({
      status: "success",
      length: sessions.count,
      data: sessions.rows,
    });
  },
);
export const getOneSessionInfo = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const sessionId = req.params.id;
    const session = await getOneSessionDetailsService({
      sessionId: +sessionId,
    });
    res.status(200).json({ status: "success", data: session });
  },
);
export const replaceSessionInfoTeacher = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId, oldTeacherId, newTeacherId } = req.body;
    const oldSessionInfo = await getOneSessionInfoServiceBy({
      where: { userId, teacherId: oldTeacherId, willContinue: true },
    });
    if (!oldSessionInfo) {
      return next(
        new AppError(
          404,
          "There is no sessions where this user choose to continue with this old teacher!",
        ),
      );
    }
    const transaction: Transaction = await sequelize.transaction();
    try {
      await updateOneSessionInfoService({
        id: oldSessionInfo.id,
        updatedData: { willContinue: false },
        transaction,
      });
      let newSessionInfo: SessionInfo;
      const existSessionInfo = await getOneSessionInfoServiceBy({
        where: { userId, teacherId: newTeacherId },
      });
      if (existSessionInfo) {
        newSessionInfo = await updateOneSessionInfoService({
          id: existSessionInfo.id,
          updatedData: { willContinue: true },
        });
      } else {
        newSessionInfo = await createSessionInfoService({
          userId,
          teacherId: newTeacherId,
          willContinue: true,
          transaction,
        });
      }
      const newSessions = await updateSessionsService({
        values: { sessionInfoId: newSessionInfo.id },
        where: {
          status: SessionStatus.PENDING,
          sessionInfoId: oldSessionInfo.id,
        },
        transaction,
      });
      await transaction.commit();
      res.status(200).json({
        status: "success",
        message:
          "Sessions details updated successfully and the teacher has changed All Remain session of old teacher transfer to the new Teacher!",
        data: newSessions,
      });
    } catch (error: any) {
      await transaction.rollback();
      return next(
        new AppError(400, `Error While Replace teacher: ${error.message}`),
      );
    }
  },
);
export const createSessionAdmin = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    let {
      userId,
      teacherId,
      sessionDates,
      sessionDuration,
      sessionCount,
      sessionsPerWeek,
      type,
    } = req.body;
    const newSessionDates: Date[] = [];
    const currentDate = new Date();
    for (let date of sessionDates) {
      checkDateFormat(date);
      if (new Date(date) <= currentDate) {
        return next(
          new AppError(
            400,
            "please provide date that is in the future not in the past!",
          ),
        );
      }
      newSessionDates.push(new Date(date));
    }
    if (sessionsPerWeek !== newSessionDates.length) {
      return next(
        new AppError(
          400,
          "please provide dates that have the same length of sessions per week!",
        ),
      );
    }
    if (type === SessionType.FREE && newSessionDates.length > 1) {
      throw new AppError(
        400,
        "please provide only one date for the free session!",
      );
    }
    const t = await sequelize.transaction();
    try {
      const teacher = await getTeacherByIdService({ id: teacherId });
      const user = await getUserByIdService({ userId });
      let sessionInfo = await getOrCreateSessionInfoService({
        teacherId,
        userId,
        transaction: t,
      });
      const sessionBody = {
        sessionInfoId: sessionInfo.id,
        sessionDates: newSessionDates,
        sessionDuration,
        transaction: t,
        studentEmail: user.email,
        studentName: user.name,
        teacherEmail: teacher.email,
        teacherName: teacher.name,
      };
      let session;
      if (type === SessionType.FREE) {
        session = await createFreeSessionService({
          ...sessionBody,
          sessionDate: newSessionDates[0],
        });
      }
      session = await createPaidSessionsService({
        ...sessionBody,
        sessionCount: sessionCount ?? sessionsPerWeek * 4, // 4 weeks per month
        sessionsPerWeek,
      });
      await updateUserRemainSessionService({
        userId,
        amountOfSessions: session.length ?? 1,
        transaction: t,
      });
      await t.commit();
      res.status(201).json({ status: "success", data: session });
    } catch (error: any) {
      await t.rollback();
      return next(
        new AppError(400, `Error creating session! ${error.message}`),
      );
    }
  },
);
export const updateSessionAttendance = async (
  req: IRequestWithUser,
  res: Response,
  next: NextFunction,
) => {
  const t = await sequelize.transaction();
  try {
    const sessionId = req.body.sessionId;
    if (req.user) {
      await updateSessionStudentAttendanceService({
        sessionId,
        userId: req.user.id,
        attend: true,
        transaction: t,
      });
    } else if (req.teacher) {
      await updateSessionTeacherAttendanceService({
        sessionId,
        teacherId: req.teacher.id,
        attend: true,
        transaction: t,
      });
    } else {
      return next(new AppError(400, "Can't define which user signed in!"));
    }
    await t.commit();
    res
      .status(200)
      .json({ status: "success", message: "attendance updated Successfully" });
  } catch (error: any) {
    await t.rollback();
    return next(
      new AppError(400, `Some thing went wrong like : ${error.message}`),
    );
  }
};

export const requestSessionReschedule = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { teacherId, userId, sessionId, newDatesOptions } = req.body;
    const session = await getOneSessionService({ sessionId });
    const MAX_NUMBER_OF_REQUESTS = 4;
    if (session.reschedule_request_count >= MAX_NUMBER_OF_REQUESTS) {
      return next(
        new AppError(
          400,
          "Can't request new schedule because every session has maximum two requests and this session take all it's opportunities!",
        ),
      );
    }
    if (!canRescheduleSession(session.sessionDate)) {
      return next(
        new AppError(
          403,
          "Cant Request a reschedule before 10 minutes of the session!",
        ),
      );
    }
    if (!Array.isArray(newDatesOptions)) {
      return next(new AppError(400, "please provide newDatesOptions as list!"));
    }
    const datesArr: Date[] = [];
    for (const date of newDatesOptions) {
      checkDateFormat(date);
      const currentDate = new Date();
      const newSessionDate = new Date(date);
      if (
        (session.status === SessionStatus.TEACHER_ABSENT ||
          session.status === SessionStatus.USER_ABSENT) &&
        newSessionDate.getTime() <= new Date(session.sessionDate).getTime()
      ) {
        return next(
          new AppError(
            400,
            `please provide date that is after the session date not before it!: Session Date=> ${session.sessionDate} Your Date => ${newSessionDate}`,
          ),
        );
      } else if (currentDate.getTime() > newSessionDate.getTime()) {
        return next(
          new AppError(
            400,
            `Please provide date in the future not in the past!: Your Entered Date=> ${newSessionDate}`,
          ),
        );
      } else if (
        currentDate.getTime() + HOUR_IN_MILLISECONDS >
        newSessionDate.getTime()
      ) {
        return next(
          new AppError(
            400,
            `Please provide date and time that is at least one hour from now!`,
          ),
        );
      }
      datesArr.push(newSessionDate);
    }
    const previousRequest = await getPendingRequestBySessionIdService({
      sessionId,
    });
    if (previousRequest) {
      return next(
        new AppError(
          400,
          "Can't request another reschedule before the previous request has response",
        ),
      );
    }
    if (teacherId && session.status === SessionStatus.TEACHER_ABSENT) {
      return next(
        new AppError(
          403,
          "Can't request a reschedule for session you were absent at the user only who can request reschedule!",
        ),
      );
    }
    if (userId && session.status === SessionStatus.USER_ABSENT) {
      return next(
        new AppError(
          403,
          "Can't request a reschedule for session you were absent at the teacher only who can request reschedule!",
        ),
      );
    }
    const transaction = await sequelize.transaction();
    try {
      let rescheduleReq: RescheduleRequest;
      let requestedBy: RoleType;
      if (teacherId) {
        await isTeacherHasOverlappingSessions({
          teacherId,
          wantedSessionDates: datesArr,
          wantedSessionDuration: session.sessionDuration,
        });
        rescheduleReq = await teacherRequestRescheduleService({
          sessionId,
          teacherId,
          newDatesOptions: datesArr,
          transaction,
        });
        requestedBy = RoleType.TEACHER;
      } else if (userId) {
        rescheduleReq = await userRequestRescheduleService({
          sessionId,
          userId,
          newDatesOptions,
          transaction,
        });
        requestedBy = RoleType.USER;
      } else {
        return next(new AppError(400, "Can't determined who request this!"));
      }
      scheduleSessionRescheduleRequestMailJob({
        requestedBy,
        sessionId,
        newDatesOptions,
        sessionOldDate: rescheduleReq.oldDate,
      });
      await scheduleSessionRescheduleRequestStatus({
        rescheduleRequestId: rescheduleReq.id,
        sessionDate: session.sessionDate,
        transaction,
      });
      await session.increment({ reschedule_request_count: 1 }, { transaction });
      emitRescheduleRequestForUser(userId || teacherId, rescheduleReq);
      await transaction.commit();
      res.status(200).json({
        status: "success",
        message: "Reschedule Requested successfully!",
        data: rescheduleReq,
      });
    } catch (error: any) {
      await transaction.rollback();
      return next(
        new AppError(400, `Error while request reschedule: ${error.message}`),
      );
    }
  },
);
export const cancelSessionRescheduleRequest = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { requestId, userId, teacherId } = req.body;
    const request = await getOneRescheduleRequestService({ id: requestId });
    if (request.status !== RescheduleRequestStatus.PENDING) {
      return next(
        new AppError(
          400,
          "Can't delete request because it's already responded to!",
        ),
      );
    }
    let localSession;
    if (userId) {
      const { session, exist } = await userOwnThisSession({
        userId,
        sessionId: request.sessionId,
      });
      if (!exist) {
        return next(
          new AppError(
            403,
            "you don't own this session that associated with the request!",
          ),
        );
      }
      if (request.requestedBy !== RoleType.USER) {
        return next(
          new AppError(400, "Can't cancel request that you didn't requested"),
        );
      }
      localSession = session;
    } else if (teacherId) {
      const { session, exist } = await teacherOwnThisSession({
        teacherId,
        sessionId: request.sessionId,
      });
      if (!exist) {
        return next(
          new AppError(
            403,
            "you don't own this session that associated with the request!",
          ),
        );
      }
      if (request.requestedBy !== RoleType.TEACHER) {
        return next(
          new AppError(400, "Can't cancel request that you didn't requested"),
        );
      }
      localSession = session;
    } else {
      return next(
        new AppError(400, "Can't determine who is signed in user or teacher"),
      );
    }
    const transaction = await sequelize.transaction();
    try {
      await localSession.decrement(
        { reschedule_request_count: 1 },
        { transaction },
      );
      await request.destroy({ transaction });
      await transaction.commit();
      res
        .status(200)
        .json({ status: "success", message: "request deleted successfully!" });
    } catch (error: any) {
      await transaction.rollback();
      return next(
        new AppError(400, `Error while deleting request: ${error.message}`),
      );
    }
  },
);
export const getAllRescheduleRequestsForAdmin = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    let offset;
    const { nPage, nLimit, status } = getPaginationParameter(req);
    if (nPage && nLimit) {
      offset = nPage * nLimit;
    }
    const requests = await getAllRescheduleRequestsService({
      findOptions: {
        limit: nLimit,
        offset,
        include: [
          {
            model: Session,
            attributes: ["sessionInfoId"],
            include: [
              {
                model: SessionInfo,
                attributes: ["userId", "teacherId"],
                include: [
                  { model: User, attributes: getUserAttr },
                  { model: Teacher, attributes: getTeacherAtt },
                ],
              },
            ],
          },
        ],
      },
    });
    res.status(200).json({ status: "success", data: requests });
  },
);
export const updateStatusSessionReschedule = (
  status: RescheduleRequestStatus,
) =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { teacherId, userId, rescheduleRequestId, newDate } = req.body;
    const rescheduleRequest = await getOneRescheduleRequestService({
      id: rescheduleRequestId,
    });
    const requestedBy = rescheduleRequest.requestedBy;
    if (
      (requestedBy === RoleType.TEACHER && teacherId) ||
      (requestedBy === RoleType.USER && userId)
    ) {
      return next(
        new AppError(403, "can't update status of request that you asked!"),
      );
    }
    if (rescheduleRequest.status !== RescheduleRequestStatus.PENDING) {
      return next(new AppError(400, "Already responded to!"));
    }
    // to check if the teacher has this session to accept the request
    let localSession;
    if (teacherId) {
      const { exist, session } = await teacherOwnThisSession({
        teacherId,
        sessionId: rescheduleRequest.sessionId,
      });
      if (!exist) {
        return next(
          new AppError(401, "can't update request for session is not yours"),
        );
      }
      localSession = session;
    } else if (userId) {
      const { exist, session } = await userOwnThisSession({
        userId,
        sessionId: rescheduleRequest.sessionId,
      });
      if (!exist) {
        return next(
          new AppError(401, "can't update request for session is not yours"),
        );
      }
      localSession = session;
    } else {
      return next(new AppError(400, "cant determine who singed in!"));
    }
    const transaction = await sequelize.transaction();

    let updatedRequest: RescheduleRequest;
    try {
      if (status === RescheduleRequestStatus.DECLINED) {
        updatedRequest = await updateRescheduleRequestService({
          requestId: rescheduleRequestId,
          status,
          transaction,
        });
        await transaction.commit();
        return res.status(200).json({
          status: "success",
          message:
            "reschedule request declined successfully! There is the data of the request after update",
          data: updatedRequest,
        });
      }
      const dateStr = rescheduleRequest.newDatesOptions.join(", ");
      const match = rescheduleRequest.newDatesOptions.some((d) => {
        return datesMatch(d, new Date(newDate));
      });
      if (!match) {
        return next(
          new AppError(
            400,
            `please provide date that in the the reschedule request in: ${dateStr}`,
          ),
        );
      }
      if (teacherId) {
        await isTeacherHasOverlappingSessions({
          teacherId,
          wantedSessionDates: rescheduleRequest.newDatesOptions,
          wantedSessionDuration: localSession.sessionDuration,
        });
      }
      updatedRequest = await updateRescheduleRequestService({
        requestId: rescheduleRequestId,
        status,
        newDate,
        transaction,
      });
      // update session
      const updatedSession = await updateSessionService({
        sessionId: rescheduleRequest.sessionId,
        updatedData: {
          sessionDate: newDate,
          teacherAttended: false,
          studentAttended: false,
          meetingLink: null,
          status: SessionStatus.PENDING,
        } as any,
        transaction,
      });
      // reschedule session jobs
      if (updatedSession.status === SessionStatus.PENDING) {
        // else it won't be exist because the job is deleted after it's status is updated other than pending
        await rescheduleSessionJobs({
          sessionId: rescheduleRequest.sessionId,
          newDate: new Date(newDate),
          sessionDuration: updatedSession.sessionDuration,
          transaction,
        });
        scheduleSessionRescheduleRequestUpdateMailJob({
          requestedBy: requestedBy as RoleType,
          rescheduleRequestId,
          status,
        });
      } else if (
        updatedSession.status === SessionStatus.TEACHER_ABSENT ||
        updatedSession.status === SessionStatus.USER_ABSENT
      ) {
        const session = await getOneSessionDetailsService({
          sessionId: updatedSession.id,
        });
        // send mail after 4 mins of the started session for the absent users
        await scheduleSessionStartReminderMailJob({
          sessionId: session.id,
          sessionDate: new Date(newDate),
          transaction,
        });
        // send mail before 30 of the session to remind both student and teacher
        await scheduleSessionReminderMailJob({
          sessionDate: new Date(newDate),
          sessionId: session.id,
          studentEmail: session.sessionInfo?.user?.email!,
          studentName: session.sessionInfo?.user?.name!,
          teacherEmail: session.sessionInfo?.teacher?.email!,
          teacherName: session.sessionInfo?.teacher?.name!,
          transaction,
        });
        // update the status of the session to be ongoing at it's time
        await scheduleUpdateSessionToOngoing({
          sessionId: updatedSession.id,
          sessionDate: new Date(newDate),
          transaction,
        });
        // update the status of the session to be finished based on the status of the absents
        await scheduleUpdateSessionToFinished({
          sessionId: updatedSession.id,
          sessionDate: new Date(newDate),
          sessionDuration: updatedSession.sessionDuration,
          transaction,
        });
      } else {
        return next(
          new AppError(
            404,
            `Error while updating request session! can't determine the status of the request!`,
          ),
        );
      }
      // no need now for the job that checked missed requests
      const jobName = getRescheduleRequestJobName(rescheduleRequestId);
      await deleteJobServiceWhere({
        destroyOption: { where: { name: jobName } },
      });
      await transaction.commit();

      res.status(200).json({
        status: "success",
        message:
          "reschedule request accepted successfully! There is the data of the new updated Session",
        data: { updatedSession, updatedRequest },
      });
    } catch (error: any) {
      await transaction.rollback();
      return next(
        new AppError(400, `Error updating request :${error.message}`),
      );
    }
  });
export const userContinueWithTeacher = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { sessionId, sessionDates, userId } = req.body;
    const { exist, session } = await userOwnThisSession({ userId, sessionId });
    if (!exist) {
      return next(new AppError(400, "User don't own this session"));
    }
    if (session.type !== SessionType.FREE) {
      return next(
        new AppError(
          400,
          "Can't continue with teacher from paid session you already with him!",
        ),
      );
    }
    const sessionInfo = await getSessionInfoService({
      id: session.sessionInfoId,
    });
    if (typeof sessionInfo.willContinue === "boolean") {
      return next(new AppError(400, "already responded to!"));
    }
    const user = await getUserByIdService({ userId });
    if (user.sessionPlaced) {
      return next(
        new AppError(
          403,
          "You already placed your session wait for the next month or contact your admin",
        ),
      );
    }
    const subscription = await checkUserSubscription({ userId });
    if (subscription.status !== SubscriptionStatus.ACTIVE) {
      return next(
        new AppError(400, "You  must activate your subscription first!"),
      );
    }
    if (!Array.isArray(sessionDates)) {
      return next(
        new AppError(400, "Please provide sessionDates as list or array!"),
      );
    }
    await sessionPerWeekEqualDates({
      userId,
      sessionDatesLength: sessionDates.length,
    });
    const transaction = await sequelize.transaction();
    try {
      await updateTeacherBalance({
        teacherId: sessionInfo.teacherId!,
        mins: session.sessionDuration,
        transaction,
      });
      const newSessionDates: Date[] = [];
      const currentDate = new Date();
      for (let date of sessionDates) {
        checkDateFormat(date);
        if (new Date(date) < currentDate) {
          await transaction.rollback();
          return next(
            new AppError(
              400,
              "please provide date that is in the future not in the past!",
            ),
          );
        }
        newSessionDates.push(new Date(date));
      }
      await isTeacherHasOverlappingSessions({
        teacherId: sessionInfo.teacherId!,
        wantedSessionDates: newSessionDates,
        wantedSessionDuration: subscription.plan.sessionDuration,
      });
      const teacher = await getTeacherByIdService({
        id: sessionInfo.teacherId!,
      });
      const paidSessions = await createPaidSessionsService({
        sessionInfoId: sessionInfo.id,
        sessionDates: newSessionDates,
        sessionCount: subscription.plan.sessionsCount,
        sessionDuration: subscription.plan.sessionDuration,
        sessionsPerWeek: subscription.plan.sessionsPerWeek,
        transaction,
        studentEmail: user.email,
        studentName: user.name,
        teacherEmail: teacher.email,
        teacherName: teacher.name,
      });
      await updateUserService({
        userId,
        updatedData: { sessionPlaced: true },
        transaction,
      });
      sessionInfo.willContinue = true;
      await sessionInfo.save({ transaction });
      await transaction.commit();
      res.status(201).json({
        status: "success",
        message:
          "The user chose to continue with that teacher and placed his session successfully!",
        data: paidSessions,
      });
    } catch (error: any) {
      await transaction.rollback();
      return next(new AppError(400, `Error Placed Session: ${error.message}`));
    }
  },
);
export const userWontContinueWithTeacher = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { sessionId, userId } = req.body;
    const { exist, session } = await userOwnThisSession({ userId, sessionId });
    if (!exist) {
      return next(new AppError(400, "User don't own this session"));
    }
    if (session.type !== SessionType.FREE) {
      return next(
        new AppError(
          400,
          "Can't choose continue option with teacher from paid session!",
        ),
      );
    }
    const sessionInfo = await getSessionInfoService({
      id: session.sessionInfoId,
    });
    if (typeof sessionInfo.willContinue === "boolean") {
      return next(new AppError(400, "already responded to!"));
    }
    sessionInfo.willContinue = false;
    await sessionInfo.save();
    res.status(200).json({
      status: "success",
      message: "user chose to NOT continue with teacher!",
    });
  },
);
export const getUserContinueStatus = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.body;
    const session = await getUserLatestNotPendingSessionService({ userId });
    if (!session || session.count == 0) {
      return next(new AppError(400, "User had not session before!"));
    }
    const sessionInfo = await getOneSessionInfoServiceBy({
      where: { id: session.rows[0].sessionInfoId },
      include: [
        { model: User, attributes: getUserAttr },
        { model: Teacher, attributes: getTeacherAtt },
      ],
    });
    res.status(200).json({ status: "success", data: sessionInfo });
  },
);
export const getAdminSessionStats = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const sessionStats = await getAdminSessionsStatisticsService();
    res.status(200).json({ status: "success", data: sessionStats });
  },
);
export const getContinueWithTeacherAbstract = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { nLimit, offset } = getPaginationParameter(req);
    const sessionDateMap: Record<number, string> = {};
    const result = await getAllSessionsService({
      findOptions: {
        where: { type: SessionType.FREE },
        limit: nLimit,
        offset: offset ?? 0,
      },
    });
    const sessionInfoIds: number[] = result.rows.map((session) => {
      return session.sessionInfoId;
    });
    result.rows.forEach((session) => {
      sessionDateMap[session.sessionInfoId] =
        session.sessionDate.toLocaleString("en-US", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        });
    });
    const sessionInfo = await getAllSessionsInfoService({
      findOptions: {
        where: { id: sessionInfoIds },
        include: [
          { model: User, attributes: getUserAttr },
          { model: Teacher, attributes: getTeacherAtt },
        ],
      },
    });
    const formattedData = sessionInfo.map((info) => ({
      sessionInfoId: info.id,
      sessionDate: sessionDateMap[info.id],
      continueStatus: info.willContinue,
      userName: info.user?.name,
      userEmail: info.user?.email,
      teacherName: info.teacher?.name,
      teacherEmail: info.teacher?.email,
    }));
    res.status(200).json({
      status: "success",
      length: sessionInfo.length,
      data: formattedData,
    });
  },
);
export const deleteSession = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;
    await deleteSessionService({ id: +id });
    res
      .status(200)
      .json({ status: "success", message: "session deleted successfully!" });
  },
);
export const updateContinueWithTeacherAdmin = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { sessionInfoId, status } = req.body;
    const sessionInfo = await updateOneSessionInfoService({
      id: sessionInfoId,
      updatedData: { willContinue: status },
    });
    res.status(200).json({
      status: "success",
      message: "Status updated successfully",
      data: sessionInfo,
    });
  },
);
export const updateSessionForAdmin = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const sessionId = req.params.id;
    const {
      teacherAttended,
      studentAttended,
      sessionDate,
      status,
      reschedule_request_count,
      hasReport,
      meetingLink,
    } = req.body;
    let session = await getOneSessionWithSessionInfoOnlyService({
      sessionId: +sessionId,
    });
    const transaction = await sequelize.transaction();
    try {
      if (sessionDate) {
        checkDateFormat(sessionDate);
        await isTeacherHasOverlappingSessions({
          teacherId: session.sessionInfo?.teacherId!,
          wantedSessionDates: [new Date(sessionDate)],
          wantedSessionDuration: session.sessionDuration,
        });
        await updateSessionService({
          sessionId: session.id,
          updatedData: {
            sessionDate: new Date(sessionDate),
          },
          transaction,
        });
        await rescheduleSessionJobs({
          sessionId: session.id,
          newDate: new Date(sessionDate),
          sessionDuration: session.sessionDuration,
          transaction,
        });
      }
      if (status) {
        await updateSessionServiceWithUserAndTeacherBalance({
          sessionId: session.id,
          status,
          userId: session.sessionInfo?.userId!,
          teacherId: session.sessionInfo?.teacherId!,
          transaction,
        });
      }
      let updatedSession = await updateSessionService({
        sessionId: session.id,
        updatedData: {
          reschedule_request_count,
          hasReport,
          teacherAttended,
          studentAttended,
          meetingLink,
        },
      });
      await transaction.commit();
      res.status(200).json({
        status: "success",
        message: "session updated successfully",
        data: updatedSession,
      });
    } catch (error: any) {
      await transaction.rollback();
      return next(
        new AppError(
          400,
          `Can't update session Some thing went wrong like : ${error.message}`,
        ),
      );
    }
  },
);
