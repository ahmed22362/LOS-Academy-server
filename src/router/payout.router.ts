import { RequestHandler, Router } from "express";
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
  .get(
    protectTeacher,
    restrictTo(RoleType.ADMIN) as RequestHandler,
    getTeacherPayouts,
  );

payoutRouter
  .route("/")
  .post(
    protectTeacher,
    setUserOrTeacherId as RequestHandler,
    restrictTo(RoleType.ADMIN) as RequestHandler,
    validate(createPayoutSchema),
    createPayout,
  )
  .get(
    protectTeacher,
    restrictTo(RoleType.ADMIN) as RequestHandler,
    getAllPayouts,
  );

payoutRouter
  .route("/:id")
  .get(protectTeacher, setUserOrTeacherId as RequestHandler, getOnePayout)
  .patch(
    protectTeacher,
    setUserOrTeacherId as RequestHandler,
    restrictTo(RoleType.ADMIN) as RequestHandler,
    updateAmountPayout,
  )
  .delete(
    protectTeacher,
    restrictTo(RoleType.ADMIN) as RequestHandler,
    deletePayout,
  );
export default payoutRouter;
