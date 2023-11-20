import { Router } from "express"
import {
  createSubscription,
  deleteSubscription,
  getAllUsersSubscriptions,
  updateSubscription,
} from "../controller/subscription.controller"
import { protectUser, setUserOrTeacherId } from "../controller/user.controller"
import { protectTeacher } from "../controller/teacher.controller"
import { restrictTo } from "../controller/auth.controller"
import validate from "../middleware/validate"
import { RoleType } from "../db/models/teacher.model"
import { createCustomSubscriptionSchema } from "../schema/subscription.schema"
const subscriptionRouter = Router()

subscriptionRouter
  .route("/")
  .post(
    protectUser,
    setUserOrTeacherId,
    validate(createCustomSubscriptionSchema),
    createSubscription
  )
  .get(
    protectTeacher,
    setUserOrTeacherId,
    restrictTo(RoleType.ADMIN),
    getAllUsersSubscriptions
  )
subscriptionRouter
  .route("/:id")
  .patch(protectTeacher, restrictTo(RoleType.ADMIN), updateSubscription)
  .delete(protectTeacher, restrictTo(RoleType.ADMIN), deleteSubscription)

export default subscriptionRouter
