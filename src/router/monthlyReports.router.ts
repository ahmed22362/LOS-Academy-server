import { RequestHandler, Router } from "express";
import {
  createMonthlyReport,
  deleteMonthlyReport,
  getAllMonthlyReports,
  getMonthlyReport,
  getUserMonthlyReport,
  updateMonthlyReport,
} from "../controller/monthlyReport.controller";
import validate from "../middleware/validate";
import {
  protectUser,
  setUserIdToParams,
  setUserOrTeacherId,
} from "../controller/user.controller";
import { restrictTo } from "../controller/auth.controller";
import { RoleType } from "../db/models/teacher.model";
import { protectTeacher } from "../controller/teacher.controller";
import { createMonthlyReportSchema } from "../schema/monthlyReport.shcema";

const monthlyReportRouter = Router();

monthlyReportRouter
  .route("/")
  .post(
    protectTeacher,
    setUserOrTeacherId as RequestHandler,
    validate(createMonthlyReportSchema),
    createMonthlyReport,
  )
  .get(
    protectTeacher,
    restrictTo(RoleType.ADMIN) as RequestHandler,
    getAllMonthlyReports,
  );
monthlyReportRouter
  .route("/user")
  .get(protectUser, setUserOrTeacherId as RequestHandler, getUserMonthlyReport);
monthlyReportRouter
  .route("/:id")
  .patch(
    protectTeacher,
    setUserOrTeacherId as RequestHandler,
    updateMonthlyReport,
  )
  .get(getMonthlyReport)
  .delete(
    protectTeacher,
    setUserOrTeacherId as RequestHandler,
    deleteMonthlyReport,
  );

export default monthlyReportRouter;
