import { Router } from "express"
import memoryMulter from "../middleware/multer"
import { protectTeacher } from "../controller/teacher.controller"
import { setUserOrTeacherId } from "../controller/user.controller"
import { uploadToB2 } from "../middleware/uploadB2"
import {
  createMaterial,
  deleteOneMaterial,
  getAllMaterial,
  getMyMaterial,
  getOneMaterial,
  updateOneMaterial,
} from "../controller/material.controller"
import { restrictTo } from "../controller/auth.controller"
import { RoleType } from "../db/models/teacher.model"
const materialRouter = Router()

const upload = memoryMulter

materialRouter
  .route("/myMaterial")
  .get(protectTeacher, setUserOrTeacherId, getMyMaterial)

materialRouter
  .route("/")
  .post(
    upload.any(),
    protectTeacher,
    setUserOrTeacherId,
    uploadToB2,
    createMaterial
  )
  .get(protectTeacher, getAllMaterial)
materialRouter
  .route("/:id")
  .get(protectTeacher, getOneMaterial)
  .patch(protectTeacher, updateOneMaterial)
  .delete(protectTeacher, restrictTo(RoleType.ADMIN), deleteOneMaterial)
export default materialRouter
