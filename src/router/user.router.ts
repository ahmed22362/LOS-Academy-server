import { Router } from "express"
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
  getUserRemainSessions,
  getUserSessions,
  getUserUpcomingSession,
  protectUser,
  setUserIdToParams,
  setUserOrTeacherId,
  updateUser,
  updateUserPlan,
} from "../controller/user.controller"
import authRouter from "./auth.router"
import { getUserReports } from "../controller/report.controller"
import {
  getUserSessionReq,
  updateSessionReqDate,
} from "../controller/sessionReq.controller"
import { protectTeacher } from "../controller/teacher.controller"
import { restrictTo } from "../controller/auth.controller"
import { RoleType } from "../db/models/teacher.model"
import validate from "../middleware/validate"
import { createUserSchema } from "../schema/user.schema"
import {
  updateStatusSessionReschedule,
  userRequestSessionReschedule,
} from "../controller/session.controller"
import { RescheduleRequestStatus } from "../db/models/rescheduleReq.model"

const userRouter = Router()

userRouter.use("/auth", authRouter)

userRouter
  .route("/")
  .post(
    protectTeacher,
    restrictTo(RoleType.ADMIN),
    validate(createUserSchema),
    createUser
  )
  .get(protectTeacher, restrictTo(RoleType.ADMIN), getAllUsers)
userRouter
  .route("/me")
  .get(protectUser, setUserIdToParams, getUser)
  .patch(protectUser, setUserIdToParams, updateUser)
userRouter.get(
  "/mySubscription",
  protectUser,
  setUserOrTeacherId,
  getMySubscription
)
userRouter.get(
  "/mySessionReq",
  protectUser,
  setUserOrTeacherId,
  getUserSessionReq
)
userRouter
  .route("/requestReschedule")
  .post(protectUser, setUserOrTeacherId, userRequestSessionReschedule)
  .get(protectUser, setUserOrTeacherId, getMySessionRescheduleRequests)
userRouter
  .route("/receivedRescheduleRequests")
  .get(protectUser, setUserOrTeacherId, getReceivedSessionRescheduleRequests)
userRouter
  .route("/allRescheduleRequests")
  .get(protectUser, setUserOrTeacherId, getAllSessionRescheduleRequests)
userRouter
  .route("/acceptReschedule")
  .post(
    protectUser,
    setUserOrTeacherId,
    updateStatusSessionReschedule(RescheduleRequestStatus.APPROVED)
  )
userRouter
  .route("/declineReschedule")
  .post(
    protectUser,
    setUserOrTeacherId,
    updateStatusSessionReschedule(RescheduleRequestStatus.DECLINED)
  )
userRouter.patch(
  "/mySessionReq/:id",
  protectUser,
  setUserOrTeacherId,
  updateSessionReqDate
)
userRouter.get(
  "/myHistorySessions",
  protectUser,
  setUserOrTeacherId,
  getMyHistorySessions
)
userRouter.get(
  "/remainSessions",
  protectUser,
  setUserOrTeacherId,
  getUserRemainSessions
)
userRouter.get(
  "/upcomingSession",
  protectUser,
  setUserOrTeacherId,
  getUserUpcomingSession
)
userRouter.get(
  "/ongoingSession",
  protectUser,
  setUserOrTeacherId,
  getUserUpcomingSession
)
userRouter.get("/mySessions", protectUser, setUserOrTeacherId, getUserSessions)
userRouter.get("/myReports", protectUser, setUserOrTeacherId, getUserReports)
userRouter.get("/updateMyPlan", protectUser, updateUserPlan)
userRouter.get("/checkJWT", checkJWT)
userRouter
  .route("/:id")
  .patch(
    protectTeacher,
    restrictTo(RoleType.ADMIN),
    setUserOrTeacherId,
    updateUser
  )
  .delete(protectTeacher, restrictTo(RoleType.ADMIN), deleteUser)
  .get(protectTeacher, getUser)

export default userRouter
