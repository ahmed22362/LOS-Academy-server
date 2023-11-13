import { Express } from "express"
import errorHandler from "./middleware/error.handler"
import AppError from "./utils/AppError"
import userRouter from "./router/user.router"
import teacherRouter from "./router/teacher.router"
import planRouter from "./router/plan.router"
import sessionRouter from "./router/session.router"
import courseRouter from "./router/course.router"
import subscriptionRouter from "./router/subscription.router"
import stripeRouter from "./router/stripe.router"
import reportRouter from "./router/report.router"
import payoutRouter from "./router/payout.router"
import materialRouter from "./router/material.router"

const PRE_API_V1: string = "/api/v1"

export default function routes(app: Express) {
  app.get("/", (req, res) => {
    res.send(
      `<h1 style="text-align:center; padding-top:100px" >LOS Academy Up And Running🚀</h1>`
    )
  })
  app.get("/success", (req, res) => {
    res.send(
      `<h1 style="text-align:center; padding-top:100px" >Success! 🐱‍🏍🐱‍👤</h1>`
    )
  })
  app.get("/cancel", (req, res) => {
    res.send(
      `<h1 style="text-align:center; padding-top:100px" >canceled! 😒</h1>`
    )
  })
  app.use(`${PRE_API_V1}/user`, userRouter)
  app.use(`${PRE_API_V1}/teacher`, teacherRouter)
  app.use(`${PRE_API_V1}/course`, courseRouter)
  app.use(`${PRE_API_V1}/plan`, planRouter)
  app.use(`${PRE_API_V1}/session`, sessionRouter)
  app.use(`${PRE_API_V1}/subscription`, subscriptionRouter)
  app.use(`${PRE_API_V1}/report`, reportRouter)
  app.use(`${PRE_API_V1}/payout`, payoutRouter)
  app.use(`${PRE_API_V1}/material`, materialRouter)
  app.use(`/stripe`, stripeRouter)
  app.all("*", (req, res, next) => {
    next(new AppError(404, `Can't find ${req.originalUrl} on this server!`))
  })
  app.use(errorHandler)
}
