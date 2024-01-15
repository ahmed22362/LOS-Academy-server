import { sequelize } from "../db/sequelize";
const { Sequelize } = require("sequelize");

export async function estimateRowCount(tableName: string) {
  try {
    const result: any = await sequelize.query(
      `SELECT count(*) FROM ${tableName};
      `,
    );

    // 'result' will contain the estimated row count
    if (result && result.length > 0) {
      console.log(result[0][0]);
      const estimate = result[0][0].count;
      return Number(estimate) ?? 1;
    } else {
      console.error("No estimate available.");
    }
  } catch (error) {
    console.error("Error estimating row count:", error);
  }
}
