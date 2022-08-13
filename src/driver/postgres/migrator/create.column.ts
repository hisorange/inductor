import { Knex } from 'knex';
import { ColumnTools } from '../../../component/column-tools';
import { IBlueprint } from '../../../interface/blueprint/blueprint.interface';
import { IColumn } from '../../../interface/blueprint/column.interface';
import { PostgresColumnType } from '../../../interface/blueprint/postgres/postgres.column-type';
import { IFactCollector } from '../../../interface/fact/fact-collector.interface';
import { getTypeName } from './util/get-type-name';

export const createColumn = (
  tableBuilder: Knex.CreateTableBuilder,
  name: string,
  column: IColumn,
  blueprint: IBlueprint,
  facts: IFactCollector,
) => {
  let columnBuilder: Knex.PostgreSqlColumnBuilder;

  if (column.type.name === PostgresColumnType.ENUM) {
    // Check if the enum native type is already defined
    const nativeType = column.type.nativeName;

    if (facts.isTypeExists(nativeType)) {
      columnBuilder = tableBuilder.specificType(name, nativeType);
    } else {
      columnBuilder = tableBuilder.enum(name, column.type.values, {
        useNative: true,
        enumName: column.type.nativeName,
      });
    }
  } else if (column.type.name === PostgresColumnType.JSON) {
    columnBuilder = tableBuilder.json(name);
  } else if (column.type.name === PostgresColumnType.JSONB) {
    columnBuilder = tableBuilder.jsonb(name);
  } else {
    columnBuilder = tableBuilder.specificType(name, getTypeName(column));
  }

  // Add nullable constraint
  if (column.isNullable) {
    columnBuilder.nullable();
  } else {
    columnBuilder.notNullable();
  }

  // Add unique constraint
  if (column.isUnique) {
    columnBuilder.unique();
  }

  // Add index
  if (column.isIndexed) {
    columnBuilder.index(undefined, {
      indexType: column.isIndexed,
    });
  }

  // Add primary constraint, only if this is the only primary column
  if (column.isPrimary && ColumnTools.filterPrimary(blueprint).length === 1) {
    columnBuilder.primary();
  }

  // Add default value
  if (column.defaultValue !== undefined) {
    let defaultValue = column.defaultValue;

    if (typeof defaultValue === 'object') {
      defaultValue = JSON.stringify(defaultValue);
    }

    columnBuilder.defaultTo(column.defaultValue);
  }
};
