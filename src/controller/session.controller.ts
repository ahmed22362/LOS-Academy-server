import { NextFunction, Request, Response } from "express";
import catchAsync from "../utils/catchAsync";
import {
  canRescheduleSession,
  checkDateFormat,
  createPaidSessionsService,
  generateMeetingLinkAndUpdateSession,
  getAdminSessionsStatisticsService,
  getAllSessionsServiceByStatus,
  getOneSessionDetailsService,
  getOneSessionService,
  getUserLatestNotPendingSessionService,
  isSessionAfterItsTimeRange,
  isSessionWithinTimeRange,
  isTeacherHasOverlappingSessions,
  isThereOngoingSessionForTheSameTeacher,
  teacherOwnThisSession,
  updateSessionService,
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
  getOneSessionInfoServiceBy,
  getSessionInfoService,
  updateOneSessionInfoService,
} from "../service/sessionInfo.service";
import { createSessionRequestService } from "../service/sessionReq.service";
import { deleteJobServiceWhere } from "../service/scheduleJob.service";
import { getRescheduleRequestJobName } from "../utils/processSchedulerJobs";
import { Transaction } from "sequelize";
import { SubscriptionStatus } from "../db/models/subscription.model";
import { emitRescheduleRequestForUser } from "../connect/socket";
export const THREE_MINUTES_IN_MILLISECONDS = 3 * 60 * 1000;
export const HOUR_IN_MILLISECONDS = 60 * 60 * 1000;
const DEFAULT_COURSES = ["arabic"];
export const getAllSessions = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { nPage, nLimit, status } = getPaginationParameter(req);
    const sessions = await getAllSessionsServiceByStatus({
      status: status as SessionStatus,
      page: nPage,
      pageSize: nLimit,
    });
    res
      .status(200)
      .json({ status: "success", length: sessions.length, data: sessions });
  },
);
export const getAllSessionsByStatus = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { nLimit, nPage, status } = getPaginationParameter(req);
    const sessions = await getAllSessionsServiceByStatus({
      status: status as any,
      page: nPage,
      pageSize: nLimit,
    });
    res.status(200).json({
      status: "success",
      length: sessions.length,
      data: sessions,
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
      const updatedSession = await updateOneSessionInfoService({
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
          sessionReqId: updatedSession.sessionRequestId!,
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
export const createPaidSessionAdmin = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    let { sessionInfoId, userId, teacherId, sessionDates, sessionDuration } =
      req.body;
    let sessionReqId;
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
    if (newSessionDates.length > 1) {
      return next(
        new AppError(
          400,
          "you can only create one session per time provide one date",
        ),
      );
    }
    const t = await sequelize.transaction();
    try {
      if (!sessionInfoId) {
        const sessionReq = await createSessionRequestService({
          body: {
            courses: DEFAULT_COURSES,
            userId,
            sessionDates: newSessionDates,
            type: SessionType.NOT_ASSIGN,
          },
          transaction: t,
        });
        sessionReqId = sessionReq.id;
        const sessionInfo = await createSessionInfoService({
          userId,
          teacherId,
          sessionReqId,
          transaction: t,
        });
        sessionInfoId = sessionInfo.id;
      }
      const teacher = await getTeacherByIdService({ id: teacherId });
      const user = await getTeacherByIdService({ id: userId });
      const session = createPaidSessionsService({
        sessionInfoId,
        sessionCount: 1,
        sessionDates,
        sessionDuration,
        sessionsPerWeek: 1,
        transaction: t,
        studentEmail: user.email,
        studentName: user.name,
        teacherEmail: teacher.email,
        teacherName: teacher.name,
      });
      await t.commit();
      res.status(201).json({ status: "success", data: session });
    } catch (error) {
      await t.rollback();
      return next(new AppError(400, `Error creating session!`));
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
export const generateSessionLink = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { sessionId, teacherId } = req.body;
    const { session, exist } = await teacherOwnThisSession({
      teacherId,
      sessionId,
    });
    if (!exist) {
      return next(
        new AppError(
          401,
          "You cant generate meeting link to a session is not yours",
        ),
      );
    }
    const updatedSession = await generateMeetingLinkAndUpdateSession({
      sessionId,
      status: SessionStatus.ONGOING,
    });
    res.status(200).json({
      status: "success",
      message: "session meeting link regenerated!",
      data: updatedSession,
    });
  },
);
export const updateSessionStatus = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { sessionId, teacherId, status } = req.body;
    const t = await sequelize.transaction();
    try {
      const { exist, session } = await teacherOwnThisSession({
        teacherId,
        sessionId,
      });
      if (!exist) {
        return next(
          new AppError(401, "you can't update session that is not yours"),
        );
      }
      // if (!session.studentAttended && status !== SessionStatus.USER_ABSENT) {
      //   return next(
      //     new AppError(
      //       400,
      //       "user must attend before you can update the session status!"
      //     )
      //   )
      // }
      if (
        session.status !== SessionStatus.PENDING &&
        session.status !== SessionStatus.ONGOING
      ) {
        return next(new AppError(400, "Session already updated!"));
      }
      if (status === SessionStatus.ONGOING) {
        await isThereOngoingSessionForTheSameTeacher({ teacherId });
        if (!isSessionWithinTimeRange(session.sessionDate)) {
          return next(
            new AppError(
              400,
              "Can't update session to be ongoing were it's time didn't come! you can always request a reschedule",
            ),
          );
        }
        if (!session.meetingLink) {
          return next(
            new AppError(
              400,
              "Can't make ongoing session before generating it's link! generate the link before update it status!",
            ),
          );
        }
      }
      if (
        status === SessionStatus.USER_ABSENT &&
        !isSessionAfterItsTimeRange(
          session.sessionDate,
          session.sessionDuration,
        )
      ) {
        return next(
          new AppError(
            400,
            "You have to wait till the session duration end to update the student as absent",
          ),
        );
      }
      if (!session.teacherAttended && status !== SessionStatus.TEACHER_ABSENT) {
        throw new AppError(
          401,
          "can't update status the session of absent teacher!",
        );
      }
      await updateSessionStatusService({
        id: sessionId,
        updatedData: { status },
        transaction: t,
      });
      if (status === SessionStatus.TAKEN) {
        if (session.status !== SessionStatus.ONGOING) {
          return next(
            new AppError(
              403,
              "Can't update session to be taken that is never started!",
            ),
          );
        }
        if (session.type === SessionType.PAID) {
          await updateUserRemainSessionService({
            userId: session.SessionInfo.userId as string,
            amountOfSessions: -1,
            transaction: t,
          });
        }
      }
      await t.commit();
      const updatedSession = await getOneSessionDetailsService({
        sessionId: session.id,
      });
      res.status(200).json({
        status: "success",
        message: "session status updated successfully",
        data: updatedSession,
      });
    } catch (error: any) {
      await t.rollback();
      next(new AppError(400, `Error updating session: ${error.message}`));
    }
  },
);
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
          studentEmail: session.SessionInfo.user?.email!,
          studentName: session.SessionInfo.user?.name!,
          teacherEmail: session.SessionInfo.teacher?.email!,
          teacherName: session.SessionInfo.teacher?.name!,
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
        numOfSessions: 1,
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
    if (!session || session.length == 0) {
      return next(new AppError(400, "Can't get this user sessions"));
    }
    const sessionInfo = await getOneSessionInfoServiceBy({
      where: { id: session[0].sessionInfoId },
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
