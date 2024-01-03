import catchAsync from "../utils/catchAsync";
import { NextFunction, Request, Response } from "express";
import AppError from "../utils/AppError";
import {
  IUpdateReq,
  acceptSessionRequestService,
  checkPreviousReq,
  createSessionRequestService,
  getAllSessionsRequestService,
  getOneSessionRequestService,
  getUserSessionRequestService,
  updateSessionRequestService,
} from "../service/sessionReq.service";
import { SessionStatus, SessionType } from "../db/models/session.model";
import {
  checkIfUserPlacedHisSessionBefore,
  checkUserSubscription,
  sessionPerWeekEqualDates,
} from "../service/user.service";
import User from "../db/models/user.model";
import { getPaginationParameter, getUserAttr } from "./user.controller";
import {
  checkDateFormat,
  getOneSessionDetailsService,
} from "../service/session.service";
import { sequelize } from "../db/sequelize";
import { scheduleSessionPlacedMailJob } from "../utils/scheduler";
import {
  emitSessionRequestForTeachers,
  getSocketByUserId,
} from "../connect/socket";

export const requestSession = (type: SessionType) =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { userId, sessionDates, courses } = req.body;
    if (!Array.isArray(sessionDates)) {
      return next(
        new AppError(400, "Please provide sessionDates as list or array!"),
      );
    }
    if (type === SessionType.FREE) {
      await checkPreviousReq({ userId, type: SessionType.FREE });
    } else if (type === SessionType.PAID) {
      await checkIfUserPlacedHisSessionBefore({ userId });
      await checkPreviousReq({ userId, type: SessionType.PAID });
      await checkUserSubscription({ userId });
      await sessionPerWeekEqualDates({
        userId,
        sessionDatesLength: sessionDates.length,
      });
    }
    const newSessionDates: Date[] = [];
    const currentDate = new Date();
    for (let date of sessionDates) {
      checkDateFormat(date);
      const sessionDate = new Date(date);
      if (sessionDate < currentDate) {
        return next(
          new AppError(400, "Can't request session to have date in the past!"),
        );
      }
      newSessionDates.push(sessionDate);
    }

    const t = await sequelize.transaction();
    try {
      const requestSession = await createSessionRequestService({
        body: { userId, sessionDates: newSessionDates, type, courses },
        transaction: t,
      });
      if (!requestSession) {
        return next(
          new AppError(
            400,
            "Can't create the request free session some thing wrong happened!",
          ),
        );
      }
      if (type === SessionType.FREE) {
        await User.decrement(
          { availableFreeSession: 1 },
          {
            where: { id: userId },
            transaction: t, // Pass the transaction
          },
        );
      }
      const socket = getSocketByUserId(userId);
      emitSessionRequestForTeachers(socket!, requestSession);
      await t.commit();
      res.status(201).json({ status: "success", data: requestSession });
    } catch (error: any) {
      await t.rollback();
      return next(new AppError(400, `Error Request Session! ${error.message}`));
    }
  });
export const getAllAvailableSessionsReq = (type: SessionType) =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    let page = req.query.page;
    let limit = req.query.limit;
    let nPage;
    let nLimit;
    let offset;
    if (page && limit) {
      nPage = Number(page);
      nLimit = Number(limit);
      offset = nPage * nLimit;
    }
    const sessions = await getAllSessionsRequestService({
      findOptions: {
        where: { type, status: SessionStatus.PENDING },
        include: { model: User, attributes: getUserAttr },
        limit: nLimit,
        offset,
      },
    });
    res
      .status(200)
      .json({ status: "success", length: sessions.length, data: sessions });
  });
export const getAllSessionsReq = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { nLimit, nPage, status } = getPaginationParameter(req);
    let offset;
    if (nLimit && nPage) {
      offset = nLimit * nPage;
    }
    const sessions = await getAllSessionsRequestService({
      findOptions: {
        include: { model: User, attributes: getUserAttr },
        limit: nLimit,
        offset,
        where: { status: status ? status : undefined },
      },
    });
    res
      .status(200)
      .json({ status: "success", length: sessions.length, data: sessions });
  },
);
export const getOneSessionReq = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;
    const sessionReq = await getOneSessionRequestService({ id: +id }); //  "+" to convert id to number
    res.status(200).json({ status: "success", data: sessionReq });
  },
);
export const updateSessionReqDate = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { sessionDates, courses } = req.body;
    const id = req.params.id;
    const body: IUpdateReq = { sessionDates, courses };
    const newSessionDates: Date[] = [];
    const currentDate = new Date();
    if (sessionDates && !Array.isArray(sessionDates)) {
      return next(
        new AppError(400, "Please provide dateList as list or array!"),
      );
    }
    if (sessionDates) {
      for (let date of sessionDates) {
        checkDateFormat(date);
        const sessionDate = new Date(date);
        if (sessionDate.getTime() < currentDate.getTime()) {
          return next(
            new AppError(
              400,
              "Can't Reschedule session to have date in the past!",
            ),
          );
        }
        newSessionDates.push(sessionDate);
      }
    }
    const sessionRequest = await getOneSessionRequestService({ id: +id });
    if (sessionRequest.type === SessionType.FREE) {
      body.sessionDates = [newSessionDates[0]];
    }
    if (sessionRequest.status === SessionStatus.TAKEN) {
      return next(
        new AppError(403, "Can't update request of and accepted request!"),
      );
    }
    const userSubscription = await [];
    const sessionRequestUpdated = await updateSessionRequestService({
      id: +id,
      updateBody: body,
    });
    res.status(200).json({
      status: "success",
      message: "request Time updated successfully!",
      data: sessionRequestUpdated,
    });
  },
);
export const acceptSessionReq = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { teacherId, sessionReqId } = req.body;
    const sessions = await acceptSessionRequestService({
      sessionReqId: +sessionReqId,
      teacherId: teacherId as string,
    });
    const session = await getOneSessionDetailsService({
      sessionId: Array.isArray(sessions) ? sessions[0].id : sessions.id,
    });
    scheduleSessionPlacedMailJob({
      userEmail: session.SessionInfo.user?.email as string,
      userName: session.SessionInfo.user?.name as string,
      teacherEmail: session.SessionInfo.teacher?.email as string,
      teacherName: session.SessionInfo.teacher?.name as string,
      sessionDate: session.sessionDate,
    });
    res.status(201).json({
      status: "success",
      message: "request accepted and the session are placed!",
      length: Array.isArray(sessions) ? sessions.length : 1,
      sessions,
    });
  },
);
export const cancelSessionReq = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { requestId, userId } = req.body;
    const sessionRequest = await getOneSessionRequestService({ id: requestId });
    if (userId !== sessionRequest.userId) {
      return next(
        new AppError(403, "You don't own this session to cancel it!"),
      );
    }
    if (sessionRequest.status !== SessionStatus.PENDING) {
      return next(
        new AppError(
          400,
          "Session request already responded to Can't cancel it!",
        ),
      );
    }
    const transaction = await sequelize.transaction();
    try {
      await User.increment(
        { availableFreeSession: 1 },
        {
          where: { id: userId },
          transaction,
        },
      );
      await sessionRequest.destroy({ transaction });
      await transaction.commit();
      res.status(200).json({
        status: "success",
        message: "Session request deleted successfully!",
      });
    } catch (error: any) {
      await transaction.rollback();
      return next(
        new AppError(400, `Can't delete session Request : ${error.message}`),
      );
    }
  },
);
export const getUserSessionReq = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.body;
    const requests = await getUserSessionRequestService({ userId });
    res.status(200).json({ status: "success", data: requests });
  },
);
