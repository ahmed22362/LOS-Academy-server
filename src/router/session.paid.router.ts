import { Router } from "express";
import { protectUser, setUserOrTeacherId } from "../controller/user.controller";
import { protectTeacher } from "../controller/teacher.controller";
import {
  acceptSessionReq,
  getAllAvailableSessionsReq,
  requestSession,
} from "../controller/sessionReq.controller";
import { SessionType } from "../db/models/session.model";
import validate from "../middleware/validate";
import {
  acceptSessionRequestSchema,
  createSessionRequestSchema,
} from "../schema/session.schema";
const paidSessionRouter = Router();

paidSessionRouter
  .route("/request")
  .post(
    protectUser,
    setUserOrTeacherId,
    validate(createSessionRequestSchema),
    requestSession(SessionType.PAID),
  );
paidSessionRouter
  .route("/available")
  .get(
    protectTeacher,
    setUserOrTeacherId,
    getAllAvailableSessionsReq(SessionType.PAID),
  );
paidSessionRouter
  .route("/accept")
  .post(
    protectTeacher,
    setUserOrTeacherId,
    validate(acceptSessionRequestSchema),
    acceptSessionReq,
  );

export default paidSessionRouter;
