import { RequestHandler, Router } from "express";
import {
  createSubscription,
  deleteSubscription,
  getAllUsersSubscriptions,
  updateSubscription,
} from "../controller/subscription.controller";
import { protectUser, setUserOrTeacherId } from "../controller/user.controller";
import { protectTeacher } from "../controller/teacher.controller";
import { restrictTo } from "../controller/auth.controller";
import validate from "../middleware/validate";
import { RoleType } from "../db/models/teacher.model";
import { createCustomSubscriptionSchema } from "../schema/subscription.schema";
const subscriptionRouter = Router();

subscriptionRouter
  .route("/")
  .post(
    protectUser,
    setUserOrTeacherId as RequestHandler,
    validate(createCustomSubscriptionSchema),
    createSubscription,
  )
  .get(
    protectTeacher,
    setUserOrTeacherId as RequestHandler,
    restrictTo(RoleType.ADMIN) as RequestHandler,
    getAllUsersSubscriptions,
  );
subscriptionRouter
  .route("/:id")
  .patch(
    protectTeacher,
    restrictTo(RoleType.ADMIN) as RequestHandler,
    updateSubscription,
  )
  .delete(
    protectTeacher,
    restrictTo(RoleType.ADMIN) as RequestHandler,
    deleteSubscription,
  );

export default subscriptionRouter;
