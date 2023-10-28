import { Router } from "express"
import { webhook } from "../controller/stripeWebhook.controller"
import dotenv from "dotenv"
dotenv.config()
const stripeRouter = Router()
stripeRouter.post("/webhook", webhook)
export default stripeRouter
