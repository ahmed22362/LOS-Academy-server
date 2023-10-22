import { Router } from "express"
const stripeRouter = Router()

stripeRouter.post("/webhook")

export default stripeRouter
