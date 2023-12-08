import { Router } from "express"
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
  loginTeacher,
  protectTeacher,
  updateMeTeacher,
  updateTeacher,
} from "../controller/teacher.controller"
import {
  setUserIdToParams,
  setUserOrTeacherId,
} from "../controller/user.controller"
import { getTeacherReports } from "../controller/report.controller"
import { restrictTo } from "../controller/auth.controller"
import validate from "../middleware/validate"
import {
  createTeacherSchema,
  isTeacherIdExist,
  loginTeacherSchema,
  updateMeSchema,
} from "../schema/teacher.schema"
import { RoleType } from "../db/models/teacher.model"
import {
  cancelSessionRescheduleRequest,
  requestSessionReschedule,
  updateStatusSessionReschedule,
} from "../controller/session.controller"
import { RescheduleRequestStatus } from "../db/models/rescheduleReq.model"
import { getMyPayoutRequests } from "../controller/payout.controller"
import { getTeacherMonthlyReport } from "../controller/monthlyReport.controller"
import { cancelRequestSchema } from "../schema/session.schema"
import { getSocketByUserId } from "../connect/socket"
const teacherRouter = Router()

teacherRouter
  .route("/me")
  .get(protectTeacher, setUserIdToParams, getTeacher)
  .patch(
    protectTeacher,
    setUserIdToParams,
    validate(updateMeSchema),
    updateMeTeacher
  )

teacherRouter
  .route("/")
  .post(validate(createTeacherSchema), createTeacher)
  .get(protectTeacher, restrictTo(RoleType.ADMIN), getAllTeachers)
teacherRouter.route("/login").post(validate(loginTeacherSchema), loginTeacher)
teacherRouter
  .route("/adminBalance")
  .get(protectTeacher, restrictTo(RoleType.ADMIN), getAdminBalance)
teacherRouter
  .route("/sessions")
  .get(
    protectTeacher,
    setUserOrTeacherId,
    validate(isTeacherIdExist),
    getTeacherAllSessions
  )
teacherRouter
  .route("/remainSessions")
  .get(
    protectTeacher,
    setUserOrTeacherId,
    validate(isTeacherIdExist),
    getTeacherRemainSessions
  )
teacherRouter
  .route("/takenSessions")
  .get(
    protectTeacher,
    setUserOrTeacherId,
    validate(isTeacherIdExist),
    getTeacherTakenSessions
  )
teacherRouter
  .route("/upcomingSession")
  .get(
    protectTeacher,
    setUserOrTeacherId,
    validate(isTeacherIdExist),
    getTeacherUpcomingSession
  )

teacherRouter
  .route("/ongoingSession")
  .get(
    protectTeacher,
    setUserOrTeacherId,
    validate(isTeacherIdExist),
    getTeacherOngoingSession
  )
teacherRouter
  .route("/myLatestTakenSession")
  .get(
    protectTeacher,
    setUserOrTeacherId,
    validate(isTeacherIdExist),
    getTeacherLatestTakenSession
  )
teacherRouter
  .route("/myReports")
  .get(protectTeacher, setUserOrTeacherId, getTeacherReports)
teacherRouter
  .route("/myStudents")
  .get(protectTeacher, setUserOrTeacherId, getTeacherAllStudents)
teacherRouter
  .route("/myPayouts")
  .get(protectTeacher, setUserOrTeacherId, getMyPayoutRequests)
teacherRouter
  .route("/myStatistics")
  .get(protectTeacher, setUserOrTeacherId, getMySessionsStats)
teacherRouter
  .route("/requestReschedule")
  .post(protectTeacher, setUserOrTeacherId, requestSessionReschedule)
  .get(protectTeacher, setUserOrTeacherId, getSessionRescheduleRequests)

teacherRouter
  .route("/cancelRescheduleRequest")
  .post(
    protectTeacher,
    setUserOrTeacherId,
    validate(cancelRequestSchema),
    cancelSessionRescheduleRequest
  )
teacherRouter
  .route("/receivedRescheduleRequests")
  .get(protectTeacher, setUserOrTeacherId, getReceivedSessionRescheduleRequests)
teacherRouter
  .route("/allRescheduleRequests")
  .get(protectTeacher, setUserOrTeacherId, getAllSessionRescheduleRequests)
teacherRouter
  .route("/acceptReschedule")
  .post(
    protectTeacher,
    setUserOrTeacherId,
    updateStatusSessionReschedule(RescheduleRequestStatus.APPROVED)
  )
teacherRouter
  .route("/myMonthlyReport")
  .get(protectTeacher, setUserOrTeacherId, getTeacherMonthlyReport)
teacherRouter
  .route("/declineReschedule")
  .post(
    protectTeacher,
    setUserOrTeacherId,
    updateStatusSessionReschedule(RescheduleRequestStatus.DECLINED)
  )
teacherRouter.get("/checkJWT", checkJWT)

teacherRouter
  .route("/:id")
  .get(protectTeacher, getTeacher)
  .patch(protectTeacher, restrictTo(RoleType.ADMIN), updateTeacher)
  .delete(protectTeacher, restrictTo(RoleType.ADMIN), deleteTeacher)

export default teacherRouter
