import { ITable } from '../types/table.interface';

// Temporary solution until the type interface is defined and matched with the migrator.
export const migrateTableDescriptor = (table: ITable): ITable => {
  if (!table.uniques) {
    table.uniques = {};
  }

  if (!table.indexes) {
    table.indexes = {};
  }

  if (!table.relations) {
    table.relations = {};
  }

  for (const columnName in table.columns) {
    if (Object.prototype.hasOwnProperty.call(table.columns, columnName)) {
      const columnDefinition = table.columns[columnName];

      if (columnDefinition.isIndexed === undefined) {
        columnDefinition.isIndexed = false;
      }

      if (columnDefinition.isNullable === undefined) {
        columnDefinition.isNullable = false;
      }

      if (columnDefinition.isPrimary === undefined) {
        columnDefinition.isPrimary = false;
      }

      if (columnDefinition.isUnique === undefined) {
        columnDefinition.isUnique = false;
      }
    }
  }

  return table;
};
