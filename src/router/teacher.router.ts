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
  getTeacherUpcomingSessions,
  loginTeacher,
  protectTeacher,
  updateTeacher,
} from "../controller/teacher.controller"
import { setUserOrTeacherId } from "../controller/user.controller"
import { getTeacherReports } from "../controller/report.controller"
import { restrictTo } from "../controller/auth.controller"
const teacherRouter = Router()

teacherRouter.route("/").post(createTeacher).get(getAllTeachers)
teacherRouter.route("/login").post(loginTeacher)
teacherRouter
  .route("/adminBalance")
  .get(protectTeacher, restrictTo("admin"), getAdminBalance)
teacherRouter
  .route("/sessions")
  .get(protectTeacher, setUserOrTeacherId, getTeacherAllSessions)
teacherRouter
  .route("/upcomingSessions")
  .get(protectTeacher, setUserOrTeacherId, getTeacherUpcomingSessions)
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
  .get(getTeacher)
  .patch(updateTeacher)
  .delete(deleteTeacher)

export default teacherRouter
