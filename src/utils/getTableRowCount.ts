import { sequelize } from "../db/sequelize";

export async function estimateRowCount(tableName: string) {
  try {
    let result: any = await sequelize.query(
      `SELECT reltuples AS estimate FROM pg_class WHERE relname = '${tableName}';`,
    );

    if (result && result.length > 0) {
      let estimate = result[0][0].estimate;

      if (estimate === -1) {
        // If the estimate is -1, rerun the ANALYZE command
        await sequelize.query(`ANALYZE "${tableName}";`);

        // Fetch the estimate again after running ANALYZE
        result = await sequelize.query(
          `SELECT reltuples AS estimate FROM pg_class WHERE relname = '${tableName}';`,
        );

        estimate = result[0][0].estimate;
      }

      return Number(estimate) || 1;
    } else {
      console.error("No estimate available.");
    }
  } catch (error) {
    console.error("Error estimating row count:", error);
  }
}

export async function estimateRowCountForMultipleTables(tableNames: string[]) {
  try {
    const queries = tableNames.map(
      (tableName) =>
        `SELECT '${tableName}' as table_name, reltuples AS estimate FROM pg_class WHERE relname = '${tableName}'`,
    );
    const result: any = await sequelize.query(queries.join(" UNION ALL "), {});
    const estimates: { [key: string]: number } = {};
    if (result && result.length > 0) {
      for (const row of result[0]) {
        if (row.estimate === -1) {
          await sequelize.query(`analyze "${row.table_name}"`);
          estimates[row.table_name] =
            (await estimateRowCount(row.table_name)) ?? 0;
        } else {
          estimates[row.table_name] = Number(row.estimate) || 1;
        }
      }
      return estimates;
    } else {
      console.error("No estimates available.");
    }
  } catch (error) {
    console.error("Error estimating row counts:", error);
  }
}
