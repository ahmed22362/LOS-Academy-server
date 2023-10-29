import { Router } from "express"
import { getAllFreeSessions } from "../controller/session.controller"
import { protectUser, setUserOrTeacherId } from "../controller/user.controller"
import { protectTeacher } from "../controller/teacher.controller"
import {
  acceptSessionReq,
  getAllAvailableSessionsReq,
  getAllSessionsReq,
  getOneSessionReq,
  requestSession,
  updateSessionReq,
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
  .post(protectTeacher, setUserOrTeacherId, acceptSessionReq)
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
  .route("/accept")
  .post(protectTeacher, setUserOrTeacherId, acceptSessionReq)
paidSessionRouter
  .route("/request/:id")
  .get(protectTeacher, setUserOrTeacherId, getOneSessionReq)

sessionRouter.use("/free", freeSessionRouter)
sessionRouter.use("/paid", paidSessionRouter)
sessionRouter.patch("/:id", updateSessionReq)
sessionRouter.route("/session-requests").get(protectTeacher, getAllSessionsReq)
export default sessionRouter
