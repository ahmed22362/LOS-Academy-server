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
      for (const table of ["user", "teacher"]) {
        const columns = await queryInterface.describeTable(table);
        if (!columns.whatsAppGroupJid) {
          await queryInterface.addColumn(table, "whatsAppGroupJid", {
            type: DataTypes.STRING,
            allowNull: true,
          });
        }
      }
      const reportColumns = await queryInterface.describeTable("report");
      if (!reportColumns.sessionId) {
        await queryInterface.addColumn("report", "sessionId", {
          type: DataTypes.INTEGER,
          allowNull: true,
          references: { model: "session", key: "id" },
          onDelete: "CASCADE",
        });
      }
      await sequelize.query(`
        UPDATE "report" AS report
        SET "sessionId" = session.id
        FROM "session" AS session
        WHERE report."sessionId" IS NULL
          AND report.title ~ '^Session [0-9]+ Report$'
          AND session.id = substring(report.title FROM '^Session ([0-9]+) Report$')::INTEGER
      `);
      await sequelize.query(`
        UPDATE "session" AS session
        SET "hasReport" = TRUE
        WHERE session."hasReport" = FALSE
          AND EXISTS (
            SELECT 1 FROM "report" AS report
            WHERE report."sessionId" = session.id
          )
      `);
      logger.info("database connected SUCCESSFULLY!");
    })
    .catch((err) => {
      logger.error(`Database connection failed: ${err.message}`);
      // console.error("Full error:", err); // Log full error details
    });
}

export default connectDB;
