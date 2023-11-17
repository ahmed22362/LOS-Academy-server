import { Router } from "express"
import { protectUser, setUserOrTeacherId } from "../controller/user.controller"
import { protectTeacher } from "../controller/teacher.controller"
import {
  acceptSessionReq,
  getAllAvailableSessionsReq,
  requestSession,
} from "../controller/sessionReq.controller"
import { SessionType } from "../db/models/session.model"
import { restrictTo } from "../controller/auth.controller"
import { createPaidSessionAdmin } from "../controller/session.controller"
import { RoleType } from "../db/models/teacher.model"
const paidSessionRouter = Router()

paidSessionRouter
  .route("/request")
  .post(protectUser, setUserOrTeacherId, requestSession(SessionType.PAID))
paidSessionRouter
  .route("/available")
  .get(
    protectTeacher,
    setUserOrTeacherId,
    getAllAvailableSessionsReq(SessionType.PAID)
  )
paidSessionRouter
  .route("/accept")
  .post(protectTeacher, setUserOrTeacherId, acceptSessionReq)

paidSessionRouter
  .route("/")
  .post(protectTeacher, restrictTo(RoleType.ADMIN), createPaidSessionAdmin)
export default paidSessionRouter
