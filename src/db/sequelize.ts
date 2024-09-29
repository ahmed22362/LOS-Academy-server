import { Sequelize } from "sequelize-typescript";
import dotenv from "dotenv";
import logger from "../utils/logger";

dotenv.config();
const pg_production_uri = process.env.PRODUCTION_POSTGRESQL_BD_URL as string;
const pg_local_uri = process.env.LOCAL_POSTGRESQL_BD_URL as string;
let runningDB = pg_local_uri;
if (process.env.NODE_ENV?.trim() === "production") {
  runningDB = pg_production_uri;
  logger.info(runningDB);
}
export const sequelize = new Sequelize(runningDB, {
  logging: (query) => {
    // console.log(query); // Log the SQL query to the console
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  retry: {
    max: 10,
  },
  dialectOptions: {
    statement_timeout: 1000,
  },
  models: [__dirname + "/models"],
});
