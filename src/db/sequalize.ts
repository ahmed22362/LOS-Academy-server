import { Sequelize } from "sequelize-typescript"
import dotenv from "dotenv"

dotenv.config()
const pg_render_uri = process.env.RENDER_POSTGRESQL_BD_URL as string
const pg_local_uri = process.env.LOCAL_POSTGRESQL_BD_URL as string
let runningDB = pg_local_uri
if (process.env.NODE_ENV?.trim() === "production") {
  runningDB = pg_render_uri
}
export const sequelize = new Sequelize(runningDB, {
  logging: (query) => {
    // console.log(query) // Log the SQL query to the console
  },
  models: [__dirname + "/models"], // or [Player, Team],
})
