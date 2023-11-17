import { Router } from "express"
import { protectTeacher } from "../controller/teacher.controller"
import {
  acceptSessionReq,
  getAllSessionsReq,
  getOneSessionReq,
} from "../controller/sessionReq.controller"
import freeSessionRouter from "./session.free.router"
import paidSessionRouter from "./session.paid.router"
import { protectUser, setUserOrTeacherId } from "../controller/user.controller"
import {
  generateSessionLink,
  getAllRescheduleRequests,
  getAllSessionsByStatus,
  getOneSessionInfo,
  replaceSessionInfoTeacher,
  updateSessionAttendance,
  updateSessionStatus,
  userContinueWithTeacher,
  userPlaceHisSessions,
} from "../controller/session.controller"
import { restrictTo } from "../controller/auth.controller"
import { RoleType } from "../db/models/teacher.model"
const sessionRouter = Router()

sessionRouter.route("/session-requests").get(protectTeacher, getAllSessionsReq)
sessionRouter
  .route("/request/:id")
  .get(protectTeacher, setUserOrTeacherId, getOneSessionReq)
sessionRouter.use("/free", freeSessionRouter)
sessionRouter.use("/paid", paidSessionRouter)
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
  .route("/continueWithTeacher")
  .post(protectUser, setUserOrTeacherId, userContinueWithTeacher)
sessionRouter
  .route("/placeSessionDates")
  .post(protectUser, setUserOrTeacherId, userPlaceHisSessions)
sessionRouter
  .route("/assignTeacher")
  .post(protectTeacher, restrictTo(RoleType.ADMIN), acceptSessionReq)
sessionRouter
  .route("/replaceTeacher")
  .post(protectTeacher, restrictTo(RoleType.ADMIN), replaceSessionInfoTeacher)
sessionRouter
  .route("/rescheduleRequests")
  .get(protectTeacher, restrictTo(RoleType.ADMIN), getAllRescheduleRequests)
sessionRouter
  .route("/:id")
  .get(protectTeacher, setUserOrTeacherId, getOneSessionInfo)
sessionRouter
  .route("/")
  .get(protectTeacher, setUserOrTeacherId, getAllSessionsByStatus)
export default sessionRouter
