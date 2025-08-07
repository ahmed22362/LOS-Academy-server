import { RequestHandler, Router } from "express";
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
    protectUser as RequestHandler,
    setUserOrTeacherId as RequestHandler,
    validate(createFeedbackSchema),
    createFeedBack as RequestHandler,
  )
  .get(
    protectTeacher,
    restrictTo(RoleType.ADMIN) as RequestHandler,
    getAllFeedBacks,
  );
feedBackRouter
  .route("/:id")
  .patch(
    protectTeacher,
    restrictTo(RoleType.ADMIN) as RequestHandler,
    updateFeedBack,
  )
  .get(getFeedBack)
  .delete(
    protectTeacher,
    restrictTo(RoleType.ADMIN) as RequestHandler,
    deleteFeedBack,
  );

export default feedBackRouter;
