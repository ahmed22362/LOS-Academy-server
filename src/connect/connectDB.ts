import { sequelize } from "../db/sequelize"
import logger from "../utils/logger"

let force = false
if (process.argv[2] === "force") {
  console.log("database force deleted successfully!")
  force = true
}

async function connectDB() {
  await sequelize
    .sync({
      force,
      logging: (sql) => {
        // logger.info(sql)
      },
    })
    .then(() => {
      logger.info("database connected SUCCESSFULLY!")
    })
    .catch((err) => {
      logger.error("Database connection failed:", err)
    })
}

export default connectDB
