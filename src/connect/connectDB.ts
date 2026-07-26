import { sequelize } from "../db/sequelize";
import logger from "../utils/logger";
import { DataTypes } from "sequelize";

let force = false;
if (process.argv[2] === "force") {
  logger.info("database force deleted successfully!");
  force = true;
}

async function connectDB() {
  await sequelize
    .sync({
      force,
      logging: (sql) => {
        // logger.info(sql)
      },
    })
    .then(async () => {
      const queryInterface = sequelize.getQueryInterface();
      for (const table of ["user", "material"]) {
        const columns = await queryInterface.describeTable(table);
        if (columns.age.type.startsWith("INTEGER")) {
          await queryInterface.changeColumn(table, "age", {
            type: DataTypes.FLOAT,
            allowNull: false,
          });
        }
      }
      logger.info("database connected SUCCESSFULLY!");
    })
    .catch((err) => {
      logger.error(`Database connection failed: ${err.message}`);
      // console.error("Full error:", err); // Log full error details
    });
}

export default connectDB;
