import express from "express"
import bodyParser from "body-parser"
import errorhandler from "strong-error-handler"
import morgan from "morgan"
import dotenv from "dotenv"
import path from "path"
import cookieParser from "cookie-parser"

dotenv.config()
const app = express()

// middleware for parsing application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(express.raw({ type: "application/json" }))

// middleware for json body parsing
app.use(bodyParser.json({ limit: "5mb" }))
//logging
if (process.env.NODE_ENV?.trim() === "development") {
  app.use(morgan("dev"))
} else {
  app.use(
    morgan(
      ":date[web] :remote-addr :method :url :status :response-time ms - :res[content-length]"
    )
  )
}
// Set default engine
app.set("view engine", "ejs")
app.set("views", path.join(__dirname, "views"))
// enable corse for all origins
app.use((req, res, next) => {
  res.set("Access-Control-Allow-Origin", "*")
  res.set("Access-Control-Expose-Headers", "x-total-count")
  res.set("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,PATCH,OPTIONS")
  res.set("Access-Control-Allow-Headers", "Content-Type,authorization")
  if (req.method === "OPTIONS") {
    return res.sendStatus(200)
  }
  next()
})
app.use(
  errorhandler({
    debug: process.env.ENV !== "prod",
    log: true,
  })
)

export default app
