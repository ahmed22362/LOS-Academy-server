import { Router } from "express"
import { protectUser, setUserOrTeacherId } from "../controller/user.controller"
import { protectTeacher } from "../controller/teacher.controller"
import {
  acceptSessionReq,
  getAllAvailableSessionsReq,
  requestSession,
} from "../controller/sessionReq.controller"
import { SessionType } from "../db/models/session.model"

const freeSessionRouter = Router()

freeSessionRouter
  .route("/request")
  .post(protectUser, setUserOrTeacherId, requestSession(SessionType.FREE))
freeSessionRouter
  .route("/available")
  .get(
    protectTeacher,
    setUserOrTeacherId,
    getAllAvailableSessionsReq(SessionType.FREE)
  )
freeSessionRouter
  .route("/accept")
  .post(protectTeacher, setUserOrTeacherId, acceptSessionReq)

export default freeSessionRouter
