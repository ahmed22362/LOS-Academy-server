import { Router } from "express"
import {
  checkJWT,
  createUser,
  deleteUser,
  getAllUsers,
  getMyHistorySessions,
  getMySessionRescheduleRequests,
  getMySubscription,
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

const userRouter = Router()

userRouter.use("/auth", authRouter)

userRouter.route("/").post(createUser).get(getAllUsers)
userRouter.get("/me", protectUser, setUserIdToParams, getUser)
userRouter.get(
  "/mySubscription",
  protectUser,
  setUserOrTeacherId,
  getMySubscription
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
userRouter.get("/mySessions", protectUser, setUserOrTeacherId, getUserSessions)
userRouter.get("/myReports", protectUser, setUserOrTeacherId, getUserReports)
userRouter
  .route("/myRescheduleRequests")
  .get(protectUser, setUserOrTeacherId, getMySessionRescheduleRequests)
userRouter.get("/updateMyPlan", protectUser, updateUserPlan)
userRouter.get("/checkJWT", checkJWT)
userRouter.route("/:id").patch(updateUser).delete(deleteUser).get(getUser)

export default userRouter
