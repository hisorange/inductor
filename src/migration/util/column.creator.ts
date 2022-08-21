import { Knex } from 'knex';
import { IBlueprint, IColumn } from '../../blueprint';
import { ColumnType } from '../../blueprint/types/column-type.enum';
import { IFactManager } from '../../fact/types/fact-manager.interface';
import { ColumnTools } from '../../tools/column-tools';
import { commentEncoder } from '../../tools/comment.coder';
import { getPostgresTypeName } from './get-type-name';

export const createColumn = (
  tableBuilder: Knex.CreateTableBuilder,
  name: string,
  column: IColumn,
  blueprint: IBlueprint,
  facts: IFactManager,
) => {
  let columnBuilder: Knex.PostgreSqlColumnBuilder;

  if (column.type.name === ColumnType.ENUM) {
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
  } else if (column.type.name === ColumnType.JSON) {
    columnBuilder = tableBuilder.json(name);
  } else if (column.type.name === ColumnType.JSONB) {
    columnBuilder = tableBuilder.jsonb(name);
  } else {
    columnBuilder = tableBuilder.specificType(
      name,
      getPostgresTypeName(column),
    );
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

  // Add comment for the column
  columnBuilder.comment(commentEncoder(column));

  // Add default value
  if (column.defaultValue !== undefined) {
    let defaultValue = column.defaultValue;

    if (typeof defaultValue === 'object') {
      defaultValue = JSON.stringify(defaultValue);
    }

    columnBuilder.defaultTo(column.defaultValue);
  }
};