import { Router } from "express"
import { webhook } from "../controller/stripeWebhook.controller"
const stripeRouter = Router()

stripeRouter.post("/webhook", webhook)

export default stripeRouter
