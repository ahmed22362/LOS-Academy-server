import { Router } from "express"
import {
  createUser,
  deleteUser,
  getAllUsers,
  getMyHistorySessions,
  getMySubscription,
  getUpcomingSessions,
  getUser,
  getUserSessions,
  protectUser,
  setUserIdToParams,
  setUserOrTeacherId,
  updateUser,
  updateUserPlan,
} from "../controller/user.controller"
import authRouter from "./auth.router"

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
  "/upcomingSessions",
  protectUser,
  setUserOrTeacherId,
  getUpcomingSessions
)
userRouter.get("/mySessions", protectUser, setUserOrTeacherId, getUserSessions)
userRouter.get("/updateMyPlan", protectUser, updateUserPlan)
userRouter.route("/:id").patch(updateUser).delete(deleteUser).get(getUser)

export default userRouter
