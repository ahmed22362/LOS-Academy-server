import { Express } from "express"
import { join } from "node:path"
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
import monthlyReportRouter from "./router/monthlyReports.router"
import feedBackRouter from "./router/feedback.router"
import { getSocketByUserId } from "./connect/socket"
import { verifyToken } from "./utils/jwt"
import catchAsync from "./utils/catchAsync"
import swaggerJsdoc from "../swagger-output.json"
import swaggerUi from "swagger-ui-express"

const PRE_API_V1: string = "/api/v1"

export default function routes(app: Express) {
  app.get('/api-doc',swaggerUi.serve,swaggerUi.setup(swaggerJsdoc))
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
  //only for test purpose
  app.get("/chat", (req, res) => {
    let token = req.cookies.token
    if (!token) {
      console.error("there is no token in chat test router")
      token = "no token"
    }
    const link = `${req.protocol}s://${req.get("host")}/`
    res.render(join(__dirname, "/views/index.ejs"), { token, link })
  })
  app.get(
    "/emit",
    catchAsync(async (req, res, next) => {
      const token = req.cookies.token
      if (!token) {
        return next(new AppError(404, "there is no token!"))
      }
      const user = await verifyToken(token)
      const message = req.query.message
      const event = req.query.event || "event"
      const socket = getSocketByUserId(user.id)
      console.log(`socket founded socketId: ${socket?.id}`)
      socket?.emit(event as string, message)
      console.log(`${event} event has emitted!`)
      res.sendStatus(200)
    })
  )
  app.use(`${PRE_API_V1}/user`, userRouter)
  app.use(`${PRE_API_V1}/teacher`, teacherRouter)
  app.use(`${PRE_API_V1}/course`, courseRouter)
  app.use(`${PRE_API_V1}/plan`, planRouter)
  app.use(`${PRE_API_V1}/session`, sessionRouter)
  app.use(`${PRE_API_V1}/subscription`, subscriptionRouter)
  app.use(`${PRE_API_V1}/report`, reportRouter)
  app.use(`${PRE_API_V1}/payout`, payoutRouter)
  app.use(`${PRE_API_V1}/material`, materialRouter)
  app.use(`${PRE_API_V1}/feedback`, feedBackRouter)
  app.use(`${PRE_API_V1}/monthlyReport`, monthlyReportRouter)
  app.use(`/stripe`, stripeRouter)
  app.all("*", (req, res, next) => {
    next(new AppError(404, `Can't find ${req.originalUrl} on this server!`))
  })
  app.use(errorHandler)
}
