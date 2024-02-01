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
  createSessionAdmin,
  deleteSession,
  getAdminSessionStats,
  getAllRescheduleRequestsForAdmin,
  getAllSessionsByStatus,
  getContinueWithTeacherAbstract,
  getOneSessionInfo,
  replaceSessionInfoTeacher,
  updateContinueWithTeacherAdmin,
  updateSessionAttendance,
  updateSessionForAdmin,
  userContinueWithTeacher,
  userWontContinueWithTeacher,
} from "../controller/session.controller";
import { restrictTo } from "../controller/auth.controller";
import { RoleType } from "../db/models/teacher.model";
import validate from "../middleware/validate";
import {
  assignTeacherSchema,
  cancelRequestSchema,
  createSessionByAdminSchema,
  generateLinkSchema,
  getSessionCoursesSchema,
  replaceSessionInfoTeacherSchema,
  requireEitherTeacherOrUser,
  updateSessionAttendanceByAdmin,
  updateSessionContinuityByAdmin,
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
  .route("/createSession")
  .post(
    protectTeacher,
    restrictTo(RoleType.ADMIN),
    validate(createSessionByAdminSchema),
    createSessionAdmin,
  );
sessionRouter
  .route("/updateSessionContinuity")
  .post(
    protectTeacher,
    restrictTo(RoleType.ADMIN),
    validate(updateSessionContinuityByAdmin),
    updateContinueWithTeacherAdmin,
  );
sessionRouter
  .route("/:id")
  .get(protectTeacher, setUserOrTeacherId, getOneSessionInfo)
  .patch(protectTeacher, restrictTo(RoleType.ADMIN), updateSessionForAdmin)
  .delete(protectTeacher, restrictTo(RoleType.ADMIN), deleteSession);
sessionRouter
  .route("/")
  .get(
    protectTeacher,
    setUserOrTeacherId,
    restrictTo(RoleType.ADMIN),
    getAllSessionsByStatus,
  );
export default sessionRouter;
