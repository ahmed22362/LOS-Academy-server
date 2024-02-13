import { Router } from "express";
import { protectTeacher } from "../controller/teacher.controller";
import { setUserOrTeacherId } from "../controller/user.controller";
import {
  createPayout,
  deletePayout,
  getAllPayouts,
  getMyPayouts,
  getOnePayout,
  getTeacherPayouts,
  updateAmountPayout,
} from "../controller/payout.controller";
import { restrictTo } from "../controller/auth.controller";
import { RoleType } from "../db/models/teacher.model";
import validate from "../middleware/validate";
import { createPayoutSchema } from "../schema/payout.schema";
const payoutRouter = Router();

payoutRouter
  .route("/teacherPayout")
  .get(protectTeacher, restrictTo(RoleType.ADMIN), getTeacherPayouts);

payoutRouter
  .route("/")
  .post(
    protectTeacher,
    setUserOrTeacherId,
    restrictTo(RoleType.ADMIN),
    validate(createPayoutSchema),
    createPayout,
  )
  .get(protectTeacher, restrictTo(RoleType.ADMIN), getAllPayouts);

payoutRouter
  .route("/:id")
  .get(protectTeacher, setUserOrTeacherId, getOnePayout)
  .patch(
    protectTeacher,
    setUserOrTeacherId,
    restrictTo(RoleType.ADMIN),
    updateAmountPayout,
  )
  .delete(protectTeacher, restrictTo(RoleType.ADMIN), deletePayout);
export default payoutRouter;
