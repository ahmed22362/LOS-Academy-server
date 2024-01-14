import { Router } from "express";
import { protectTeacher } from "../controller/teacher.controller";
import {
  acceptSessionReq,
  cancelSessionReq,
  getAllSessionsReq,
  getOneSessionReq,
} from "../controller/sessionReq.controller";
import freeSessionRouter from "./session.free.router";
import paidSessionRouter from "./session.paid.router";
import { protectUser, setUserOrTeacherId } from "../controller/user.controller";
import {
  generateSessionLink,
  getAdminSessionStats,
  getAllRescheduleRequestsForAdmin,
  getAllSessionsByStatus,
  getContinueWithTeacherAbstract,
  getOneSessionInfo,
  getSessionCourses,
  replaceSessionInfoTeacher,
  updateSessionAttendance,
  updateSessionStatus,
  userContinueWithTeacher,
  userWontContinueWithTeacher,
} from "../controller/session.controller";
import { restrictTo } from "../controller/auth.controller";
import { RoleType } from "../db/models/teacher.model";
import validate from "../middleware/validate";
import {
  assignTeacherSchema,
  cancelRequestSchema,
  generateLinkSchema,
  getSessionCoursesSchema,
  replaceSessionInfoTeacherSchema,
  requireEitherTeacherOrUser,
  updateSessionStatusSchema,
  userContinueWithTeacherSchema,
  userWontContinueWithTeacherSchema,
} from "../schema/session.schema";
const sessionRouter = Router();

sessionRouter.route("/session-requests").get(protectTeacher, getAllSessionsReq);
sessionRouter
  .route("/continueAbstract")
  .get(
    protectTeacher,
    restrictTo(RoleType.ADMIN),
    getContinueWithTeacherAbstract,
  );
sessionRouter
  .route("/statistics")
  .get(protectTeacher, restrictTo(RoleType.ADMIN), getAdminSessionStats);
sessionRouter
  .route("/request/:id")
  .get(protectTeacher, setUserOrTeacherId, getOneSessionReq);
sessionRouter.use("/free", freeSessionRouter);
sessionRouter.use("/paid", paidSessionRouter);
sessionRouter
  .route("/cancelSessionRequest")
  .post(
    protectUser,
    setUserOrTeacherId,
    validate(cancelRequestSchema),
    cancelSessionReq,
  );
sessionRouter
  .route("/updateUserAttendance")
  .post(
    protectUser,
    setUserOrTeacherId,
    validate(requireEitherTeacherOrUser),
    updateSessionAttendance,
  );
sessionRouter
  .route("/updateTeacherAttendance")
  .post(
    protectTeacher,
    setUserOrTeacherId,
    validate(requireEitherTeacherOrUser),
    updateSessionAttendance,
  );
sessionRouter
  .route("/generateLink")
  .post(
    protectTeacher,
    setUserOrTeacherId,
    validate(generateLinkSchema),
    generateSessionLink,
  );
sessionRouter
  .route("/status")
  .post(
    protectTeacher,
    setUserOrTeacherId,
    validate(updateSessionStatusSchema),
    updateSessionStatus,
  );
sessionRouter
  .route("/continueWithTeacher")
  .post(
    protectUser,
    setUserOrTeacherId,
    validate(userContinueWithTeacherSchema),
    userContinueWithTeacher,
  );
sessionRouter
  .route("/wontContinueWithTeacher")
  .post(
    protectUser,
    setUserOrTeacherId,
    validate(userWontContinueWithTeacherSchema),
    userWontContinueWithTeacher,
  );
sessionRouter
  .route("/assignTeacher")
  .post(
    protectTeacher,
    restrictTo(RoleType.ADMIN),
    validate(assignTeacherSchema),
    acceptSessionReq,
  );
sessionRouter
  .route("/replaceTeacher")
  .post(
    protectTeacher,
    restrictTo(RoleType.ADMIN),
    validate(replaceSessionInfoTeacherSchema),
    replaceSessionInfoTeacher,
  );
sessionRouter
  .route("/rescheduleRequests")
  .get(
    protectTeacher,
    restrictTo(RoleType.ADMIN),
    getAllRescheduleRequestsForAdmin,
  );
sessionRouter
  .route("/sessionCourses")
  .get(validate(getSessionCoursesSchema), getSessionCourses);
sessionRouter
  .route("/:id")
  .get(protectTeacher, setUserOrTeacherId, getOneSessionInfo);
sessionRouter
  .route("/")
  .get(
    protectTeacher,
    setUserOrTeacherId,
    restrictTo(RoleType.ADMIN),
    getAllSessionsByStatus,
  );
export default sessionRouter;
