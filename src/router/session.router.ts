import { Router } from "express"
import {
  acceptAndCreateFreeSession,
  getAllAvailableFreeSessionsReq,
  getAllFreeSessions,
  getAllFreeSessionsReq,
  requestFreeSession,
} from "../controller/freeSession.controller"
import { protectUser, setUserOrTeacherId } from "../controller/user.controller"
import { protectTeacher } from "../controller/teacher.controller"
const sessionRouter = Router()
const freeSessionRouter = Router()
freeSessionRouter
  .route("/request")
  .post(protectUser, setUserOrTeacherId, requestFreeSession)
freeSessionRouter
  .route("/available")
  .get(protectTeacher, getAllAvailableFreeSessionsReq)

freeSessionRouter
  .route("/accept")
  .post(protectTeacher, setUserOrTeacherId, acceptAndCreateFreeSession)
freeSessionRouter
  .route("/:id")
  .post(protectTeacher, setUserOrTeacherId, acceptAndCreateFreeSession)

freeSessionRouter.route("/").get(protectTeacher, getAllFreeSessions)

sessionRouter.use("/free", freeSessionRouter)
sessionRouter
  .route("/session-requests")
  .get(protectTeacher, getAllFreeSessionsReq)
export default sessionRouter
