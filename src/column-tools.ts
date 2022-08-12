import { PostgresColumnTools } from './driver/postgres/postgres.column-tools';
import { IBlueprint } from './interface/blueprint/blueprint.interface';

// Find and filter the primary column names from the blueprint
export const filterPrimary = (blueprint: IBlueprint) => {
  const primaries = [];

  for (const colName in blueprint.columns) {
    if (Object.prototype.hasOwnProperty.call(blueprint.columns, colName)) {
      const colDef = blueprint.columns[colName];

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
