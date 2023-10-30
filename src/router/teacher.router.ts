import { Router } from "express"
import {
  createTeacher,
  deleteTeacher,
  getAllTeachers,
  getTeacher,
  getTeacherSessions,
  loginTeacher,
  protectTeacher,
  updateTeacher,
} from "../controller/teacher.controller"
import { setUserOrTeacherId } from "../controller/user.controller"
const teacherRouter = Router()

teacherRouter.route("/").post(createTeacher).get(getAllTeachers)
teacherRouter.route("/login").post(loginTeacher)
teacherRouter
  .route("/mySessions")
  .get(protectTeacher, setUserOrTeacherId, getTeacherSessions)
teacherRouter
  .route("/:id")
  .get(getTeacher)
  .patch(updateTeacher)
  .delete(deleteTeacher)

export default teacherRouter
