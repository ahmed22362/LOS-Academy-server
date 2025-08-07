import { RequestHandler, Router } from "express";
import {
  createCourse,
  deleteCourse,
  getAllCourses,
  getCourse,
  updateCourse,
} from "../controller/course.controller";
import validate from "../middleware/validate";
import { createCourseSchema } from "../schema/course.schema";
import { protectTeacher } from "../controller/teacher.controller";
import { IRequestWithUser, restrictTo } from "../controller/auth.controller";
import { RoleType } from "../db/models/teacher.model";

const courseRouter = Router();

courseRouter
  .route("/")
  .post(
    protectTeacher,
    restrictTo(RoleType.ADMIN) as RequestHandler<
      {},
      {},
      {},
      {},
      IRequestWithUser
    >,
    validate(createCourseSchema),
    createCourse,
  )
  .get(getAllCourses);
courseRouter
  .route("/:id")
  .patch(
    protectTeacher,
    restrictTo(RoleType.ADMIN) as RequestHandler<
      {},
      {},
      {},
      {},
      IRequestWithUser
    >,
    updateCourse,
  )
  .get(getCourse)
  .delete(
    protectTeacher,
    restrictTo(RoleType.ADMIN) as RequestHandler<
      {},
      {},
      {},
      {},
      IRequestWithUser
    >,
    deleteCourse,
  );

export default courseRouter;
