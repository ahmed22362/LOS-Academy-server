import { RequestHandler, Router } from "express";
import {
  checkJWT,
  createTeacher,
  deleteTeacher,
  getAdminBalance,
  getAllSessionRescheduleRequests,
  getAllTeachers,
  getMySessionsStats,
  getReceivedSessionRescheduleRequests,
  getSessionRescheduleRequests,
  getTeacher,
  getTeacherAllSessions,
  getTeacherAllStudents,
  getTeacherLatestTakenSession,
  getTeacherOngoingSession,
  getTeacherRemainSessions,
  getTeacherTakenSessions,
  getTeacherUpcomingSession,
  getUsersAndTeachersCount,
  loginTeacher,
  protectTeacher,
  updateMeTeacher,
  updateTeacher,
} from "../controller/teacher.controller";
import {
  setUserIdToParams,
  setUserOrTeacherId,
} from "../controller/user.controller";
import { getTeacherReports } from "../controller/report.controller";
import { restrictTo } from "../controller/auth.controller";
import validate from "../middleware/validate";
import {
  createTeacherSchema,
  isTeacherIdExist,
  loginTeacherSchema,
  updateMeSchema,
} from "../schema/teacher.schema";
import { RoleType } from "../db/models/teacher.model";
import {
  cancelSessionRescheduleRequest,
  requestSessionReschedule,
  updateStatusSessionReschedule,
} from "../controller/session.controller";
import { RescheduleRequestStatus } from "../db/models/rescheduleReq.model";
import { getMyPayouts } from "../controller/payout.controller";
import { getTeacherMonthlyReport } from "../controller/monthlyReport.controller";
import { cancelRequestSchema } from "../schema/session.schema";
const teacherRouter = Router();

teacherRouter
  .route("/me")
  .get(protectTeacher, setUserIdToParams as RequestHandler, getTeacher)
  .patch(
    protectTeacher,
    setUserIdToParams as RequestHandler,
    validate(updateMeSchema),
    updateMeTeacher,
  );

teacherRouter.route("/login").post(validate(loginTeacherSchema), loginTeacher);
teacherRouter
  .route("/adminBalance")
  .get(
    protectTeacher,
    restrictTo(RoleType.ADMIN) as RequestHandler,
    getAdminBalance,
  );
teacherRouter
  .route("/totalRecordsOf")
  .get(
    protectTeacher,
    restrictTo(RoleType.ADMIN) as RequestHandler,
    getUsersAndTeachersCount,
  );
teacherRouter
  .route("/sessions")
  .get(
    protectTeacher,
    setUserOrTeacherId as RequestHandler,
    validate(isTeacherIdExist),
    getTeacherAllSessions,
  );
teacherRouter
  .route("/remainSessions")
  .get(
    protectTeacher,
    setUserOrTeacherId as RequestHandler,
    validate(isTeacherIdExist),
    getTeacherRemainSessions,
  );
teacherRouter
  .route("/takenSessions")
  .get(
    protectTeacher,
    setUserOrTeacherId as RequestHandler,
    validate(isTeacherIdExist),
    getTeacherTakenSessions,
  );
teacherRouter
  .route("/upcomingSession")
  .get(
    protectTeacher,
    setUserOrTeacherId as RequestHandler,
    validate(isTeacherIdExist),
    getTeacherUpcomingSession,
  );

teacherRouter
  .route("/ongoingSession")
  .get(
    protectTeacher,
    setUserOrTeacherId as RequestHandler,
    validate(isTeacherIdExist),
    getTeacherOngoingSession,
  );
teacherRouter
  .route("/myLatestTakenSession")
  .get(
    protectTeacher,
    setUserOrTeacherId as RequestHandler,
    validate(isTeacherIdExist),
    getTeacherLatestTakenSession,
  );
teacherRouter
  .route("/myReports")
  .get(protectTeacher, setUserOrTeacherId as RequestHandler, getTeacherReports);
teacherRouter
  .route("/myStudents")
  .get(
    protectTeacher,
    setUserOrTeacherId as RequestHandler,
    getTeacherAllStudents,
  );
teacherRouter
  .route("/myPayouts")
  .get(protectTeacher, setUserOrTeacherId as RequestHandler, getMyPayouts);
teacherRouter
  .route("/myStatistics")
  .get(
    protectTeacher,
    setUserOrTeacherId as RequestHandler,
    getMySessionsStats,
  );
teacherRouter
  .route("/requestReschedule")
  .post(
    protectTeacher,
    setUserOrTeacherId as RequestHandler,
    requestSessionReschedule,
  )
  .get(
    protectTeacher,
    setUserOrTeacherId as RequestHandler,
    getSessionRescheduleRequests,
  );

teacherRouter
  .route("/cancelRescheduleRequest")
  .post(
    protectTeacher,
    setUserOrTeacherId as RequestHandler,
    validate(cancelRequestSchema),
    cancelSessionRescheduleRequest,
  );
teacherRouter
  .route("/receivedRescheduleRequests")
  .get(
    protectTeacher,
    setUserOrTeacherId as RequestHandler,
    getReceivedSessionRescheduleRequests,
  );
teacherRouter
  .route("/allRescheduleRequests")
  .get(
    protectTeacher,
    setUserOrTeacherId as RequestHandler,
    getAllSessionRescheduleRequests,
  );
teacherRouter
  .route("/acceptReschedule")
  .post(
    protectTeacher,
    setUserOrTeacherId as RequestHandler,
    updateStatusSessionReschedule(RescheduleRequestStatus.APPROVED),
  );
teacherRouter
  .route("/myMonthlyReport")
  .get(
    protectTeacher,
    setUserOrTeacherId as RequestHandler,
    getTeacherMonthlyReport,
  );
teacherRouter
  .route("/declineReschedule")
  .post(
    protectTeacher,
    setUserOrTeacherId as RequestHandler,
    updateStatusSessionReschedule(RescheduleRequestStatus.DECLINED),
  );
teacherRouter.get("/checkJWT", checkJWT);

teacherRouter
  .route("/:id")
  .get(protectTeacher, getTeacher)
  .patch(
    protectTeacher,
    restrictTo(RoleType.ADMIN) as RequestHandler,
    updateTeacher,
  )
  .delete(
    protectTeacher,
    restrictTo(RoleType.ADMIN) as RequestHandler,
    deleteTeacher,
  );
teacherRouter
  .route("/")
  .post(validate(createTeacherSchema), createTeacher)
  .get(
    protectTeacher,
    restrictTo(RoleType.ADMIN) as RequestHandler,
    getAllTeachers,
  );
export default teacherRouter;
