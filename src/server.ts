import app from "./app"
import routes from "./routes"
import logger from "./utils/logger"
import connectDB from "./connect/connectDB"
import rescheduleJobs from "./utils/processSchedulerJobs"
const PORT = process.env.PORT || 3000

process.on("uncaughtException", (err) => {
  console.log("UNCAUGHT EXCEPTION!")
  console.log(err)
})
process.on("unhandledRejection", (err: any) => {
  logger.error("UNHANDLED REJECTION!")
  logger.error(err)
})
app.listen(PORT, async () => {
  logger.info(`Server running on port ${PORT}`)
  await connectDB()
  await rescheduleJobs()
  routes(app)
})
