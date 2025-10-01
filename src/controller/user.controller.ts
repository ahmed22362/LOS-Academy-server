import { NextFunction, Request, Response } from "express";
import User, { IUserInput, USER_TABLE_NAME } from "../db/models/user.model";
import catchAsync from "../utils/catchAsync";
import {
  createUserService,
  deleteUserService,
  getUserByIdService,
  getUserSubscriptionPlan,
  getUsersService,
  updateUserService,
} from "../service/user.service";
import AppError from "../utils/AppError";
import { decodedToken, login, protect, restrictTo } from "./auth.controller";
import {
  createStripeBillingPortal,
  createStripeCustomer,
  getStripeSubscription,
} from "../service/stripe.service";
import {
  OrderAssociation,
  getUserAllSessionsService,
  getUserAllTakenSessionsService,
  getUserLatestNotPendingSessionService,
  getUserOngoingSessionService,
  getUserRemainSessionsService,
  getUserSessionStats,
  getUserUpcomingSessionService,
} from "../service/session.service";
import { verifyToken } from "../utils/jwt";
import {
  getUserAllRescheduleRequestsService,
  getUserReceivedRescheduleRequestsService,
  getUserRescheduleRequestsService,
} from "../service/rescheduleReq.service";
import { SubscriptionStatus } from "../db/models/subscription.model";
import { getTeacherByIdService } from "../service/teacher.service";
import Teacher, { RoleType } from "../db/models/teacher.model";
import { SessionStatus } from "../db/models/session.model";

export const MONTH_IN_MS = 2629800000;
export const setUserOrTeacherId = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.body.user && !req.body.userId)
    req.body.userId = (req.user as User)?.id;
  if (!req.body.teacher && !req.body.teacherId)
    req.body.teacherId = (req.teacher as Teacher)?.id;
  next();
};
export const setUserIdToParams = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.params.id) req.params.id = (req.user as User)?.id as string;
  if (!req.params.id) req.params.id = (req.teacher as Teacher)?.id as string;
  next();
};
export const getUserAttr = [
  "id",
  "name",
  "phone",
  "email",
  "availableFreeSession",
  "remainSessions",
  "age",
  "gender",
  "verified",
  "sessionPlaced",
];

export const loginUser = login(User);
export const protectUser = protect(User);
export const createUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { name, age, email, password, phone, gender } = req.body;
    const body = { name, age, email, password, phone, gender } as IUserInput;

    const newUser = await createUserService({ userData: body });
    if (!newUser) {
      return next(new AppError(400, "Can't create new User!"));
    }
    const stripeCustomer = await createStripeCustomer({
      email,
      name: name,
      phone,
    });
    newUser.customerId = stripeCustomer.id;
    await newUser.save();
    res.status(200).json({ status: "success", data: newUser });
  },
);
export const getAllUsers = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { nLimit, offset } = getPaginationParameter(req);
    const users = await getUsersService({
      findOptions: { attributes: getUserAttr, limit: nLimit, offset },
    });
    if (!users) {
      return next(new AppError(400, "Error getting all users!"));
    }
    res.status(200).json({
      status: "success",
      length: users?.count,
      data: users.rows,
    });
  },
);
export const deleteUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;
    const force = <string>req.query.force;

    const deleteState = await deleteUserService({
      userId: id,
      force,
    });
    if (!deleteState) {
      return next(new AppError(400, "Error Deleting User!"));
    }
    res
      .status(200)
      .json({ status: "success", message: "user Deleted successfully" });
  },
);
export const updateUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;
    const {
      name,
      email,
      phone,
      age,
      gender,
      remainSessions,
      availableFreeSession,
      verified,
      customerId,
      sessionPlaced,
    } = req.body;

    const body: any = {}; // Use Partial to make all properties optional

    if (name) body.name = name;
    if (email) body.email = email;
    if (phone) body.phone = phone;
    if (age) body.age = age;
    if (gender) body.gender = gender;
    body.customerId = customerId;

    if (req.body.teacherId) {
      const teacher = await getTeacherByIdService({ id: req.body.teacherId });
      if (teacher.role === RoleType.ADMIN) {
        if (remainSessions !== undefined) body.remainSessions = remainSessions;
        if (availableFreeSession !== undefined)
          body.availableFreeSession = availableFreeSession;
        if (verified !== undefined) body.verified = verified;
        if (sessionPlaced) body.sessionPlaced = sessionPlaced;
      }
    }

    const user = await updateUserService({
      userId: id,
      updatedData: body as object,
    });
    if (!user) {
      return next(new AppError(404, "Can't find user to update!"));
    }
    res.status(200).json({
      status: "success",
      message: "user updated successfully",
      data: user,
    });
  },
);
export const getUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;
    const user = await getUserByIdService({
      userId: id,
      findOptions: { attributes: getUserAttr },
    });
    if (!user) {
      return next(new AppError(404, "Can't find user with this id!"));
    }
    res.status(200).json({ status: "success", data: user });
  },
);
export const getMySubscription = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userSubscription = await getUserSubscriptionPlan({
      userId: req.body.userId,
    });
    if (!userSubscription) {
      return res.status(200).json({
        status: "success",
        message: "user didn't subscript to any plans yet!!",
        data: [],
      });
    }
    let stripeSubscription;
    let subscriptionStartAt;
    let subscriptionEndAt;

    stripeSubscription = await getStripeSubscription(
      userSubscription.stripe_subscription_id as string,
    );
    if (
      userSubscription.status === SubscriptionStatus.ACTIVE &&
      stripeSubscription
    ) {
      (subscriptionStartAt = new Date(
        stripeSubscription.current_period_start * 1000, // convert timestamp from sec to milliseconds
      )),
        (subscriptionEndAt = new Date(
          stripeSubscription.current_period_end * 1000,
        )); // convert timestamp from sec to milliseconds
    }
    if (!subscriptionStartAt && !subscriptionEndAt) {
      subscriptionStartAt = userSubscription.createdAt;
      subscriptionEndAt = new Date(
        new Date(userSubscription.createdAt).getTime() + MONTH_IN_MS,
      );
    }
    const subscriptionRes = {
      status: userSubscription.status,
      type: userSubscription.plan.type,
      planId: userSubscription.planId,
      planTitle: userSubscription.plan.title,
      sessionDuration: userSubscription.plan.sessionDuration,
      sessionsCount: userSubscription.plan.sessionsCount,
      sessionsPerWeek: userSubscription.plan.sessionsPerWeek,
      price: userSubscription.plan.price,
      subscriptionStartAt,
      subscriptionEndAt,
    };
    res.status(200).json({ status: "success", data: [subscriptionRes] });
  },
);
export const updateUserPlan = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const customerId = (req.user as User)?.customerId;
    if (!customerId) {
      throw new AppError(404, "Can't ind customer Id to update it's plan!");
    }
    const subscription = await getUserSubscriptionPlan({
      userId: (req.user as User)?.id as string,
    });

    if (!subscription) {
      return next(
        new AppError(404, "The user is not subscribed to plan to upgrade it !"),
      );
    }
    const portal = await createStripeBillingPortal(customerId);
    res.status(200).json({
      status: "success",
      data: portal,
      message: "redirect to the portal to change the plan from it!",
    });
  },
);
export const getMyHistorySessions = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { nLimit, offset } = getPaginationParameter(req);
    const result = await getUserAllTakenSessionsService({
      userId: req.body.userId,
      limit: nLimit,
      offset,
    });

    res
      .status(200)
      .json({ status: "success", length: result?.count, data: result?.rows });
  },
);
export const getUserRemainSessions = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { nLimit, offset } = getPaginationParameter(req);
    const result = await getUserRemainSessionsService({
      userId: req.body.userId,
      limit: nLimit,
      offset,
    });
    if (!result) {
      return next(new AppError(400, "can't get this user Sessions"));
    }
    res
      .status(200)
      .json({ status: "success", length: result.count, data: result.rows });
  },
);
export const getUserUpcomingSession = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.body.userId;
    const result = await getUserUpcomingSessionService({ userId });
    if (!result) {
      return next(new AppError(400, "can't get this user Sessions"));
    }
    res.status(200).json({ status: "success", data: result.rows });
  },
);
export const getUserOngoingSession = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.body.userId;
    const result = await getUserOngoingSessionService({ userId });
    if (!result) {
      return next(new AppError(400, "can't get this user Sessions"));
    }
    res.status(200).json({ status: "success", data: result.rows });
  },
);
export const getUserLatestSession = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.body.userId;
    const result = await getUserLatestNotPendingSessionService({ userId });
    if (!result) {
      return next(new AppError(400, "Can't get this user sessions"));
    }
    res.status(200).json({ status: "success", data: result.rows });
  },
);
export const getUserSessions = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { offset, nLimit, status } = getPaginationParameter(req);
    const result = await getUserAllSessionsService({
      userId: req.body.userId,
      offset,
      limit: nLimit,
      status: status as any,
      orderAssociation: OrderAssociation.DESC,
    });
    if (!result) {
      return next(new AppError(400, "Can't get this user sessions!"));
    }
    res
      .status(200)
      .json({ status: "success", length: result.count, data: result.rows });
  },
);
export const getUserStatistics = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.body.userId;
    const stats = await getUserSessionStats({ userId });
    res.status(200).json({ status: "success", data: stats });
  },
);
export const getMySessionRescheduleRequests = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.body.userId;
    const { offset, nLimit, status } = getPaginationParameter(req);
    const rescheduleRequests = await getUserRescheduleRequestsService({
      userId,
      offset,
      limit: nLimit,
      status: status as any,
    });
    res.status(200).json({
      status: "success",
      length: rescheduleRequests.length,
      data: rescheduleRequests,
    });
  },
);
export const getReceivedSessionRescheduleRequests = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.body.userId;
    const { offset, nLimit, status } = getPaginationParameter(req);
    const rescheduleRequests = await getUserReceivedRescheduleRequestsService({
      userId,
      offset: offset,
      limit: nLimit,
      status: status as any,
    });
    res.status(200).json({
      status: "success",
      length: rescheduleRequests.length,
      data: rescheduleRequests,
    });
  },
);
export const getAllSessionRescheduleRequests = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.body.userId;
    const { offset, nLimit, status } = getPaginationParameter(req);
    const rescheduleRequests = await getUserAllRescheduleRequestsService({
      userId,
      offset,
      limit: nLimit,
      status: status as any,
    });
    res.status(200).json({
      status: "success",
      length: rescheduleRequests.length,
      data: rescheduleRequests,
    });
  },
);
export const checkJWT = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const token = req.query.token;
    const decoded = (await verifyToken(token as string)) as decodedToken;
    const user = await getUserByIdService({ userId: decoded.id });
    res.status(200).json({
      status: "success",
      message: "The token is verified!",
      userName: user?.name,
    });
  },
);
export function getPaginationParameter(req: Request) {
  const status = req.query.status;
  if (
    status &&
    !Object.values(SessionStatus).includes(status as SessionStatus)
  ) {
    throw new AppError(
      400,
      `Please provide status one of those: ${Object.values(SessionStatus)}`,
    );
  }
  let page = req.query.page;
  let limit = req.query.limit;
  let nPage;
  let nLimit;
  let offset;
  let orderBy;
  if (
    req.query.orderBy &&
    !Object.values(OrderAssociation).includes(
      req.query.orderBy as OrderAssociation,
    )
  ) {
    throw new AppError(
      400,
      'Please enter order by one of those ["DESC", "ASC"] ',
    );
  } else {
    orderBy = req.query.orderBy as OrderAssociation;
  }
  if (page) {
    nPage = Number(page);
  }
  if (limit) {
    nLimit = Number(limit);
  }
  if (page && limit) {
    offset = (nPage! - 1) * nLimit!;
  }
  return { nLimit, nPage, offset, status, orderBy };
}
