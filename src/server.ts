import app from "./app"
import routes from "./routes"
import logger from "./utils/logger"
import connectDB from "./connect/connectDB"
import rescheduleJobs from "./utils/processSchedulerJobs"
const PORT = process.env.PORT || 3000

process.on("uncaughtException", (err) => {
  logger.error("UNCAUGHT EXCEPTION! 💥 Shutting down...")
  logger.error(err.name, err.message)
  process.exit(1)
})
process.on("unhandledRejection", (err: any) => {
  logger.error("UNHANDLED REJECTION!")
  logger.error(err)
  process.exit(1)
})
app.listen(PORT, async () => {
  logger.info(`Server running on port ${PORT}`)
  await connectDB()
  await rescheduleJobs()
  routes(app)
})
