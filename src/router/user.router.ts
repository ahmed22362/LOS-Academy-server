import { RequestHandler, Router } from "express";
import {
  checkJWT,
  createUser,
  deleteUser,
  getAllSessionRescheduleRequests,
  getAllUsers,
  getMyHistorySessions,
  getMySessionRescheduleRequests,
  getMySubscription,
  getReceivedSessionRescheduleRequests,
  getUser,
  getUserLatestSession,
  getUserOngoingSession,
  getUserRemainSessions,
  getUserSessions,
  getUserStatistics,
  getUserUpcomingSession,
  protectUser,
  setUserIdToParams,
  setUserOrTeacherId,
  updateUser,
  updateUserPlan,
} from "../controller/user.controller";
import authRouter from "./auth.router";
import { getUserReports } from "../controller/report.controller";
import {
  getUserSessionReq,
  updateSessionReqDate,
} from "../controller/sessionReq.controller";
import { protectTeacher } from "../controller/teacher.controller";
import { restrictTo } from "../controller/auth.controller";
import { RoleType } from "../db/models/teacher.model";
import validate from "../middleware/validate";
import { createUserSchema } from "../schema/user.schema";
import {
  cancelSessionRescheduleRequest,
  getUserContinueStatus,
  requestSessionReschedule,
  updateStatusSessionReschedule,
} from "../controller/session.controller";
import { RescheduleRequestStatus } from "../db/models/rescheduleReq.model";
import { cancelRequestSchema } from "../schema/session.schema";

const userRouter = Router();

userRouter.use("/auth", authRouter);

userRouter
  .route("/")
  .post(
    protectTeacher,
    restrictTo(RoleType.ADMIN) as RequestHandler,
    validate(createUserSchema),
    createUser,
  )
  .get(
    protectTeacher,
    restrictTo(RoleType.ADMIN) as RequestHandler,
    getAllUsers,
  );
userRouter
  .route("/me")
  .get(protectUser, setUserIdToParams as RequestHandler, getUser)
  .patch(protectUser, setUserIdToParams as RequestHandler, updateUser);
userRouter.get(
  "/mySubscription",
  protectUser,
  setUserOrTeacherId as RequestHandler,
  getMySubscription,
);
userRouter.get(
  "/mySessionReq",
  protectUser,
  setUserOrTeacherId as RequestHandler,
  getUserSessionReq,
);
userRouter
  .route("/requestReschedule")
  .post(
    protectUser,
    setUserOrTeacherId as RequestHandler,
    requestSessionReschedule,
  )
  .get(
    protectUser,
    setUserOrTeacherId as RequestHandler,
    getMySessionRescheduleRequests,
  );
userRouter
  .route("/cancelRescheduleRequest")
  .post(
    protectUser,
    setUserOrTeacherId as RequestHandler,
    validate(cancelRequestSchema),
    cancelSessionRescheduleRequest,
  );
userRouter
  .route("/receivedRescheduleRequests")
  .get(
    protectUser,
    setUserOrTeacherId as RequestHandler,
    getReceivedSessionRescheduleRequests,
  );
userRouter
  .route("/allRescheduleRequests")
  .get(
    protectUser,
    setUserOrTeacherId as RequestHandler,
    getAllSessionRescheduleRequests,
  );
userRouter
  .route("/acceptReschedule")
  .post(
    protectUser,
    setUserOrTeacherId as RequestHandler,
    updateStatusSessionReschedule(RescheduleRequestStatus.APPROVED),
  );
userRouter
  .route("/declineReschedule")
  .post(
    protectUser,
    setUserOrTeacherId as RequestHandler,
    updateStatusSessionReschedule(RescheduleRequestStatus.DECLINED),
  );
userRouter.patch(
  "/mySessionReq/:id",
  protectUser,
  setUserOrTeacherId as RequestHandler,
  updateSessionReqDate,
);
userRouter.get(
  "/myHistorySessions",
  protectUser,
  setUserOrTeacherId as RequestHandler,
  getMyHistorySessions,
);
userRouter.get(
  "/remainSessions",
  protectUser,
  setUserOrTeacherId as RequestHandler,
  getUserRemainSessions,
);
userRouter.get(
  "/upcomingSession",
  protectUser,
  setUserOrTeacherId as RequestHandler,
  getUserUpcomingSession,
);
userRouter.get(
  "/ongoingSession",
  protectUser,
  setUserOrTeacherId as RequestHandler,
  getUserOngoingSession,
);
userRouter.get(
  "/myLatestSession",
  protectUser,
  setUserOrTeacherId as RequestHandler,
  getUserLatestSession,
);
userRouter.get(
  "/myReports",
  protectUser,
  setUserOrTeacherId as RequestHandler,
  getUserReports,
);
userRouter.get(
  "/mySessions",
  protectUser,
  setUserOrTeacherId as RequestHandler,
  getUserSessions,
);
userRouter.get(
  "/myStatistics",
  protectUser,
  setUserOrTeacherId as RequestHandler,
  getUserStatistics,
);
userRouter.get(
  "/myContinueStatus",
  protectUser,
  setUserOrTeacherId as RequestHandler,
  getUserContinueStatus,
);
userRouter.get("/updateMyPlan", protectUser, updateUserPlan);
userRouter.get("/checkJWT", checkJWT);
userRouter
  .route("/:id")
  .patch(
    protectTeacher,
    restrictTo(RoleType.ADMIN) as RequestHandler,
    setUserOrTeacherId as RequestHandler,
    updateUser,
  )
  .delete(
    protectTeacher,
    restrictTo(RoleType.ADMIN) as RequestHandler,
    deleteUser,
  )
  .get(protectTeacher, getUser);

export default userRouter;
