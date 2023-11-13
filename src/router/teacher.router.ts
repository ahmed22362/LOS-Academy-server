import { Router } from "express"
import {
  checkJWT,
  createTeacher,
  deleteTeacher,
  getAdminBalance,
  getAllTeachers,
  getMySessionRescheduleRequests,
  getTeacher,
  getTeacherAllSessions,
  getTeacherAllStudents,
  getTeacherRemainSessions,
  getTeacherTakenSessions,
  getTeacherUpcomingSession,
  loginTeacher,
  protectTeacher,
  updateTeacher,
} from "../controller/teacher.controller"
import { setUserOrTeacherId } from "../controller/user.controller"
import { getTeacherReports } from "../controller/report.controller"
import { restrictTo } from "../controller/auth.controller"
import validate from "../middleware/validate"
import {
  createTeacherSchema,
  isTeacherIdExist,
  loginTeacherSchema,
} from "../schema/teacher.schema"
import { RoleType } from "../db/models/teacher.model"
const teacherRouter = Router()

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
  .route("/myReports")
  .get(protectTeacher, setUserOrTeacherId, getTeacherReports)
teacherRouter
  .route("/myStudents")
  .get(protectTeacher, setUserOrTeacherId, getTeacherAllStudents)
teacherRouter
  .route("/myRescheduleRequests")
  .get(protectTeacher, setUserOrTeacherId, getMySessionRescheduleRequests)
teacherRouter.get("/checkJWT", checkJWT)

teacherRouter
  .route("/:id")
  .get(protectTeacher, getTeacher)
  .patch(protectTeacher, restrictTo(RoleType.ADMIN), updateTeacher)
  .delete(protectTeacher, restrictTo(RoleType.ADMIN), deleteTeacher)

export default teacherRouter
