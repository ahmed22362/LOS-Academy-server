import { Router } from "express"
import { createSubscription } from "../controller/subscription.controller"
import { protectUser, setUserOrTeacherId } from "../controller/user.controller"
const subscriptionRouter = Router()

subscriptionRouter
  .route("/")
  .post(protectUser, setUserOrTeacherId, createSubscription)

export default subscriptionRouter
