import { RequestHandler, Router } from "express";
import { protectTeacher } from "../controller/teacher.controller";
import { setUserOrTeacherId } from "../controller/user.controller";
import {
  createReport,
  deleteReport,
  getAllReports,
  getReport,
  getTeacherReports,
  getUserReports,
  updateReport,
} from "../controller/report.controller";
import { restrictTo } from "../controller/auth.controller";
import { RoleType } from "../db/models/teacher.model";
import validate from "../middleware/validate";
import { createReportSchema } from "../schema/report.schema";
const reportRouter = Router();

reportRouter.route("/user").get(protectTeacher, getUserReports);
reportRouter
  .route("/teacher")
  .get(
    protectTeacher,
    restrictTo(RoleType.ADMIN) as RequestHandler,
    getTeacherReports,
  );
reportRouter
  .route("/")
  .post(
    protectTeacher,
    setUserOrTeacherId as RequestHandler,
    validate(createReportSchema),
    createReport,
  )
  .get(
    protectTeacher,
    restrictTo(RoleType.ADMIN) as RequestHandler,
    getAllReports,
  );
reportRouter
  .route("/:id")
  .patch(protectTeacher, setUserOrTeacherId as RequestHandler, updateReport)
  .get(getReport)
  .delete(protectTeacher, setUserOrTeacherId as RequestHandler, deleteReport);

export default reportRouter;
