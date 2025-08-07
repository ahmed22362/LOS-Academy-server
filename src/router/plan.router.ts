import { RequestHandler, Router } from "express";
import {
  createPlan,
  deletePlan,
  getPlan,
  getPlans,
  updatePlan,
} from "../controller/plan.controller";
import { restrictTo } from "../controller/auth.controller";
import { protectTeacher } from "../controller/teacher.controller";
import { RoleType } from "../db/models/teacher.model";
import validate from "../middleware/validate";
import { createStandardPlanSchema } from "../schema/plan.schema";
const planRouter = Router();

planRouter
  .route("/")
  .get(getPlans)
  .post(
    protectTeacher,
    restrictTo(RoleType.ADMIN) as RequestHandler,
    validate(createStandardPlanSchema),
    createPlan,
  );

planRouter
  .route("/:id")
  .patch(
    protectTeacher,
    restrictTo(RoleType.ADMIN) as RequestHandler,
    updatePlan,
  )
  .delete(
    protectTeacher,
    restrictTo(RoleType.ADMIN) as RequestHandler,
    deletePlan,
  )
  .get(getPlan);
export default planRouter;
