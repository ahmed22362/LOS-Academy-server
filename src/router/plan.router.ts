import { Router } from "express"
import {
  createPlan,
  deletePlan,
  getPlan,
  getPlans,
  updatePlan,
} from "../controller/plan.controller"
import { restrictTo } from "../controller/auth.controller"
import { protectTeacher } from "../controller/teacher.controller"
import { RoleType } from "../db/models/teacher.model"
const planRouter = Router()

planRouter
  .route("/")
  .get(getPlans)
  .post(protectTeacher, restrictTo(RoleType.ADMIN), createPlan)

planRouter
  .route("/:id")
  .patch(protectTeacher, restrictTo(RoleType.ADMIN), updatePlan)
  .delete(protectTeacher, restrictTo(RoleType.ADMIN), deletePlan)
  .get(getPlan)
export default planRouter
