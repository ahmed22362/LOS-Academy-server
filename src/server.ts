import { createServer } from "http"
import { app } from "./app"
import { sequelize } from "./db/index"
import routes from "./routes"
import logger from "./utils/logger"

const port = process.env.PORT || 3000
let force = false
console.log(process.argv)
if (process.argv[2] === "force") {
  console.log("database force deleted successfully!")
  force = true
}

;(async () => {
  await sequelize
    .sync({
      force,
      logging: (sql) => {
        // console.log(sql)
      },
    })
    .then(() => {
      logger.info("database connected SUCCESSFULLY!")
    })
    .catch((err) => {
      logger.error("Database connection failed:", err)
    })
  app.listen(port, () => {
    routes(app)
    logger.info(`Server running on port ${port} => http://localhost:${port}/`)
  })
})()
