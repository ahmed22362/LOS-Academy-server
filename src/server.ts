import { app } from "./app"
import routes from "./routes"
import logger from "./utils/logger"
import connectDB from "./connect/connectDB"
const PORT = process.env.PORT || 3000

app.listen(PORT, async () => {
  logger.info(`Server running on port ${PORT} => http://localhost:${PORT}/`)
  await connectDB()
  routes(app)
})
