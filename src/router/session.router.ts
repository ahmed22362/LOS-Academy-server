import { Router } from "express"
import {
  acceptAndCreateFreeSession,
  getAllFreeSessions,
} from "../controller/session.controller"
import { protectUser, setUserOrTeacherId } from "../controller/user.controller"
import { protectTeacher } from "../controller/teacher.controller"
import {
  getAllAvailableSessionsReq,
  getAllSessionsReq,
  getOneSessionReq,
  requestSession,
} from "../controller/sessionReq.controller"
import { SessionType } from "../db/models/session.model"
const sessionRouter = Router()
const freeSessionRouter = Router()
const paidSessionRouter = Router()
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
  .post(protectTeacher, setUserOrTeacherId, acceptAndCreateFreeSession)
freeSessionRouter
  .route("/request/:id")
  .get(protectTeacher, setUserOrTeacherId, getOneSessionReq)

freeSessionRouter.route("/").get(protectTeacher, getAllFreeSessions)

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
  .route("/request/:id")
  .get(protectTeacher, setUserOrTeacherId, getOneSessionReq)

sessionRouter.use("/free", freeSessionRouter)
sessionRouter.use("/paid", paidSessionRouter)
sessionRouter.route("/session-requests").get(protectTeacher, getAllSessionsReq)
export default sessionRouter
