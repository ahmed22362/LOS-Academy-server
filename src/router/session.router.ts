import { Router } from "express"
import { protectTeacher } from "../controller/teacher.controller"
import {
  acceptSessionReq,
  getAllSessionsReq,
  getOneSessionReq,
  updateSessionReq,
} from "../controller/sessionReq.controller"
import freeSessionRouter from "./session.free.router"
import paidSessionRouter from "./session.paid.router"
import { protectUser, setUserOrTeacherId } from "../controller/user.controller"
import {
  generateSessionLink,
  getAllRescheduleRequests,
  getAllSessions,
  getAllSessionsByStatus,
  getOneSessionInfo,
  requestSessionReschedule,
  updateSessionAttendance,
  updateSessionStatus,
  updateStatusSessionReschedule,
} from "../controller/session.controller"
import { restrictTo } from "../controller/auth.controller"
import { RescheduleRequestStatus } from "../db/models/rescheduleReq.model"
import { RoleType } from "../db/models/teacher.model"
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
  .route("/generateLink")
  .post(protectTeacher, setUserOrTeacherId, generateSessionLink)
sessionRouter
  .route("/status")
  .post(protectTeacher, setUserOrTeacherId, updateSessionStatus)
sessionRouter
  .route("/assignTeacher")
  .post(protectTeacher, restrictTo(RoleType.ADMIN), acceptSessionReq)
sessionRouter
  .route("/request-reschedule")
  .post(protectUser, setUserOrTeacherId, requestSessionReschedule)
  .get(protectTeacher, restrictTo(RoleType.ADMIN), getAllRescheduleRequests)
sessionRouter
  .route("/accept-reschedule")
  .post(
    protectTeacher,
    setUserOrTeacherId,
    updateStatusSessionReschedule(RescheduleRequestStatus.APPROVED)
  )
sessionRouter
  .route("/decline-reschedule")
  .post(
    protectTeacher,
    setUserOrTeacherId,
    updateStatusSessionReschedule(RescheduleRequestStatus.DECLINED)
  )
sessionRouter
  .route("/:id")
  .get(protectTeacher, setUserOrTeacherId, getOneSessionInfo)
sessionRouter
  .route("/")
  .get(protectTeacher, setUserOrTeacherId, getAllSessionsByStatus)
export default sessionRouter
