import { Router } from "express";
import { protectTeacher } from "../controller/teacher.controller";
import { setUserOrTeacherId } from "../controller/user.controller";
import {
  cancelPayoutRequest,
  createPayoutRequest,
  getAllPayoutRequests,
  getMyPayoutRequests,
  getOnePayoutRequest,
  updateAmountPayoutRequest,
  updateStatusPayoutRequest,
} from "../controller/payout.controller";
import { restrictTo } from "../controller/auth.controller";
import { RoleType } from "../db/models/teacher.model";
import validate from "../middleware/validate";
import {
  createPayoutRequestSchema,
  updatePayoutStatusSchema,
} from "../schema/payout.schema";
const payoutRouter = Router();

payoutRouter.patch(
  "/status",
  protectTeacher,
  restrictTo(RoleType.ADMIN),
  validate(updatePayoutStatusSchema),
  updateStatusPayoutRequest,
);
payoutRouter.get(
  "/teacherPayout",
  protectTeacher,
  restrictTo(RoleType.ADMIN),
  getMyPayoutRequests,
);
payoutRouter.post(
  "/cancel",
  protectTeacher,
  setUserOrTeacherId,
  cancelPayoutRequest,
);
payoutRouter
  .route("/")
  .post(
    protectTeacher,
    setUserOrTeacherId,
    validate(createPayoutRequestSchema),
    createPayoutRequest,
  )
  .get(protectTeacher, restrictTo(RoleType.ADMIN), getAllPayoutRequests);

payoutRouter
  .route("/:id")
  .get(protectTeacher, setUserOrTeacherId, getOnePayoutRequest)
  .patch(protectTeacher, setUserOrTeacherId, updateAmountPayoutRequest);
export default payoutRouter;
