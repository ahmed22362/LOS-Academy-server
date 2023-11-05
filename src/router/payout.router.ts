import { Router } from "express"
import { protectTeacher } from "../controller/teacher.controller"
import { setUserOrTeacherId } from "../controller/user.controller"
import {
  createPayoutRequest,
  getAllPayoutRequests,
  getOnePayoutRequest,
  updateAmountPayoutRequest,
  updateStatusPayoutRequestService,
} from "../controller/payout.controller"
import { restrictTo } from "../controller/auth.controller"
import { RoleType } from "../db/models/teacher.model"
const payoutRouter = Router()

payoutRouter.patch(
  "/status",
  protectTeacher,
  restrictTo(RoleType.ADMIN),
  updateStatusPayoutRequestService
)
payoutRouter
  .route("/")
  .post(protectTeacher, setUserOrTeacherId, createPayoutRequest)
  .get(protectTeacher, restrictTo(RoleType.ADMIN), getAllPayoutRequests)

payoutRouter
  .route("/:id")
  .get(protectTeacher, setUserOrTeacherId, getOnePayoutRequest)
  .patch(protectTeacher, setUserOrTeacherId, updateAmountPayoutRequest)
export default payoutRouter
