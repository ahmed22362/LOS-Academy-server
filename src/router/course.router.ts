import { Router } from "express"
import {
  createCourse,
  deleteCourse,
  getAllCourses,
  getCourse,
  updateCourse,
} from "../controller/course.controller"

const courseRouter = Router()

courseRouter.route("/").post(createCourse).get(getAllCourses)
courseRouter
  .route("/:id")
  .patch(updateCourse)
  .get(getCourse)
  .delete(deleteCourse)

export default courseRouter
