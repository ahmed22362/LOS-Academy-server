import { Router } from "express";
import {
  createFeedBack,
  deleteFeedBack,
  getAllFeedBacks,
  getAllShownFeedbacks,
  getFeedBack,
  updateFeedBack,
} from "../controller/feedback.controller";
import validate from "../middleware/validate";
import { protectUser, setUserOrTeacherId } from "../controller/user.controller";
import { restrictTo } from "../controller/auth.controller";
import { RoleType } from "../db/models/teacher.model";
import { createFeedbackSchema } from "../schema/feedback.schema";
import { protectTeacher } from "../controller/teacher.controller";

const feedBackRouter = Router();

feedBackRouter.route("/shown").get(getAllShownFeedbacks);

feedBackRouter
  .route("/")
  .post(
    protectUser,
    setUserOrTeacherId,
    validate(createFeedbackSchema),
    createFeedBack,
  )
  .get(protectTeacher, restrictTo(RoleType.ADMIN), getAllFeedBacks);
feedBackRouter
  .route("/:id")
  .patch(protectTeacher, restrictTo(RoleType.ADMIN), updateFeedBack)
  .get(getFeedBack)
  .delete(protectTeacher, restrictTo(RoleType.ADMIN), deleteFeedBack);

export default feedBackRouter;
