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
const planRouter = Router()

planRouter
  .route("/")
  .get(getPlans)
  .post(protectTeacher, restrictTo("admin"), createPlan)

planRouter.route("/:id").patch(updatePlan).delete(deletePlan).get(getPlan)
export default planRouter
