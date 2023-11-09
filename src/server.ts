import app from "./app"
import routes from "./routes"
import logger from "./utils/logger"
import connectDB from "./connect/connectDB"
import Mail from "./connect/sendMail"
const PORT = process.env.PORT || 3000

app.listen(PORT, async () => {
  logger.info(`Server running on port ${PORT}`)
  await connectDB()
  routes(app)
  // await new Mail("ahmedhamada496@gmail.com", "ahmed hamada").sendWelcome()
})
