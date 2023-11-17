import { Router } from "express"
import {
  createFeedBack,
  deleteFeedBack,
  getAllFeedBacks,
  getFeedBack,
  updateFeedBack,
} from "../controller/feedback.controller"
import validate from "../middleware/validate"
import { protectUser, setUserOrTeacherId } from "../controller/user.controller"
import { restrictTo } from "../controller/auth.controller"
import { RoleType } from "../db/models/teacher.model"

const feedBackRouter = Router()

feedBackRouter
  .route("/")
  .post(protectUser, setUserOrTeacherId, createFeedBack)
  .get(getAllFeedBacks)
feedBackRouter
  .route("/:id")
  .patch(protectUser, restrictTo(RoleType.ADMIN), updateFeedBack)
  .get(getFeedBack)
  .delete(protectUser, restrictTo(RoleType.ADMIN), deleteFeedBack)

export default feedBackRouter
