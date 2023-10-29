import { Router } from "express"
import {
  createSubscription,
  getAllUsersSubscriptions,
  updateSubscription,
} from "../controller/subscription.controller"
import { protectUser, setUserOrTeacherId } from "../controller/user.controller"
import { protectTeacher } from "../controller/teacher.controller"
import { restrictTo } from "../controller/auth.controller"
const subscriptionRouter = Router()

subscriptionRouter
  .route("/")
  .post(protectUser, setUserOrTeacherId, createSubscription)
  .get(protectTeacher, setUserOrTeacherId, getAllUsersSubscriptions)
subscriptionRouter
  .route("/:id")
  .patch(protectTeacher, restrictTo("admin"), updateSubscription)

export default subscriptionRouter
