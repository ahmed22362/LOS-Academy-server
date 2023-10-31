import { Router } from "express"
import { protectTeacher } from "../controller/teacher.controller"
import {
  getAllSessionsReq,
  getOneSessionReq,
  updateSessionReq,
} from "../controller/sessionReq.controller"
import freeSessionRouter from "./session.free.router"
import paidSessionRouter from "./session.paid.router"
import { protectUser, setUserOrTeacherId } from "../controller/user.controller"
import {
  getAllSessions,
  getOneSessionInfo,
  regenerateSessionLink,
  updateSessionAttendance,
  updateSessionStatus,
} from "../controller/session.controller"
const sessionRouter = Router()

sessionRouter.route("/session-requests").get(protectTeacher, getAllSessionsReq)
sessionRouter
  .route("/request/:id")
  .get(protectTeacher, setUserOrTeacherId, getOneSessionReq)
sessionRouter.use("/free", freeSessionRouter)
sessionRouter.use("/paid", paidSessionRouter)
sessionRouter.patch(
  "/request/:id",
  protectTeacher,
  setUserOrTeacherId,
  updateSessionReq
)
sessionRouter
  .route("/updateUserAttendance")
  .post(protectUser, setUserOrTeacherId, updateSessionAttendance)
sessionRouter
  .route("/updateTeacherAttendance")
  .post(protectTeacher, setUserOrTeacherId, updateSessionAttendance)
sessionRouter
  .route("/regenerateLink")
  .post(protectTeacher, setUserOrTeacherId, regenerateSessionLink)
sessionRouter
  .route("/status")
  .post(protectTeacher, setUserOrTeacherId, updateSessionStatus)
sessionRouter
  .route("/:id")
  .get(protectTeacher, setUserOrTeacherId, getOneSessionInfo)
sessionRouter.route("/").get(protectTeacher, setUserOrTeacherId, getAllSessions)
export default sessionRouter
