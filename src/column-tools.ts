import { PostgresColumnTools } from './driver/postgres/postgres.column-tools';
import { ISchema } from './interface/schema/schema.interface';

// Find and filter the primary column names from the schema
export const filterPrimary = (schema: ISchema) => {
  const primaries = [];

  for (const colName in schema.columns) {
    if (Object.prototype.hasOwnProperty.call(schema.columns, colName)) {
      const colDef = schema.columns[colName];

      if (colDef.isPrimary) {
        primaries.push(colName);
      }
    }
  }

  return primaries;
};

export const ColumnTools = {
  postgres: PostgresColumnTools,

  filterPrimary,
};
