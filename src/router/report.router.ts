import { Router } from "express"
import { protectTeacher } from "../controller/teacher.controller"
import { setUserOrTeacherId } from "../controller/user.controller"
import {
  createReport,
  deleteReport,
  getAllReports,
  getReport,
  getTeacherReports,
  getUserReports,
  updateReport,
} from "../controller/report.controller"
import { restrictTo } from "../controller/auth.controller"
const reportRouter = Router()

reportRouter.route("/user").get(protectTeacher, getUserReports)
reportRouter
  .route("/teacher")
  .get(protectTeacher, restrictTo("admin"), getTeacherReports)
reportRouter
  .route("/")
  .post(protectTeacher, setUserOrTeacherId, createReport)
  .get(protectTeacher, restrictTo("admin"), getAllReports)
reportRouter
  .route("/:id")
  .patch(protectTeacher, setUserOrTeacherId, updateReport)
  .get(getReport)
  .delete(protectTeacher, setUserOrTeacherId, deleteReport)

export default reportRouter
