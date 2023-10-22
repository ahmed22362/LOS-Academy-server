import { Router } from "express"
import {
  createTeacher,
  deleteTeacher,
  getAllTeachers,
  getTeacher,
  loginTeacher,
  updateTeacher,
} from "../controller/teacher.controller"
const teacherRouter = Router()

teacherRouter.route("/").post(createTeacher).get(getAllTeachers)
teacherRouter
  .route("/:id")
  .get(getTeacher)
  .patch(updateTeacher)
  .delete(deleteTeacher)
teacherRouter.route("/login").post(loginTeacher)

export default teacherRouter
