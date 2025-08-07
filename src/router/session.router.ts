import { RequestHandler, Router } from "express";
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
  deleteSessionInfoForAdmin,
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
    restrictTo(RoleType.ADMIN) as RequestHandler,
    getContinueWithTeacherAbstract,
  );
sessionRouter
  .route("/statistics")
  .get(
    protectTeacher,
    restrictTo(RoleType.ADMIN) as RequestHandler,
    getAdminSessionStats,
  );
sessionRouter
  .route("/request/:id")
  .get(protectTeacher, setUserOrTeacherId as RequestHandler, getOneSessionReq);
sessionRouter.use("/free", freeSessionRouter);
sessionRouter.use("/paid", paidSessionRouter);
sessionRouter
  .route("/cancelSessionRequest")
  .post(
    protectUser,
    setUserOrTeacherId as RequestHandler,
    validate(cancelRequestSchema),
    cancelSessionReq,
  );
sessionRouter
  .route("/updateUserAttendance")
  .post(
    protectUser,
    setUserOrTeacherId as RequestHandler,
    validate(requireEitherTeacherOrUser),
    updateSessionAttendance as RequestHandler,
  );
sessionRouter
  .route("/updateTeacherAttendance")
  .post(
    protectTeacher,
    setUserOrTeacherId as RequestHandler,
    validate(requireEitherTeacherOrUser),
    updateSessionAttendance as RequestHandler,
  );
sessionRouter
  .route("/continueWithTeacher")
  .post(
    protectUser,
    setUserOrTeacherId as RequestHandler,
    validate(userContinueWithTeacherSchema),
    userContinueWithTeacher,
  );
sessionRouter
  .route("/wontContinueWithTeacher")
  .post(
    protectUser,
    setUserOrTeacherId as RequestHandler,
    validate(userWontContinueWithTeacherSchema),
    userWontContinueWithTeacher,
  );
sessionRouter
  .route("/assignTeacher")
  .post(
    protectTeacher,
    restrictTo(RoleType.ADMIN) as RequestHandler,
    validate(assignTeacherSchema),
    acceptSessionReq,
  );
sessionRouter
  .route("/replaceTeacher")
  .post(
    protectTeacher,
    restrictTo(RoleType.ADMIN) as RequestHandler,
    validate(replaceSessionInfoTeacherSchema),
    replaceSessionInfoTeacher,
  );
sessionRouter
  .route("/rescheduleRequests")
  .get(
    protectTeacher,
    restrictTo(RoleType.ADMIN) as RequestHandler,
    getAllRescheduleRequestsForAdmin,
  );
sessionRouter
  .route("/createSession")
  .post(
    protectTeacher,
    restrictTo(RoleType.ADMIN) as RequestHandler,
    validate(createSessionByAdminSchema),
    createSessionAdmin,
  );
sessionRouter
  .route("/updateSessionContinuity")
  .post(
    protectTeacher,
    restrictTo(RoleType.ADMIN) as RequestHandler,
    validate(updateSessionContinuityByAdmin),
    updateContinueWithTeacherAdmin,
  );
sessionRouter
  .route("/deleteSessionContinuity/:id")
  .delete(
    protectTeacher,
    restrictTo(RoleType.ADMIN) as RequestHandler,
    deleteSessionInfoForAdmin,
  );
sessionRouter
  .route("/:id")
  .get(protectTeacher, setUserOrTeacherId as RequestHandler, getOneSessionInfo)
  .patch(
    protectTeacher,
    restrictTo(RoleType.ADMIN) as RequestHandler,
    updateSessionForAdmin,
  )
  .delete(
    protectTeacher,
    restrictTo(RoleType.ADMIN) as RequestHandler,
    deleteSession,
  );
sessionRouter
  .route("/")
  .get(
    protectTeacher,
    setUserOrTeacherId as RequestHandler,
    restrictTo(RoleType.ADMIN) as RequestHandler,
    getAllSessionsByStatus,
  );
export default sessionRouter;
