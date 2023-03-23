import { Knex } from 'knex';
import { ColumnType } from '../../types/column-type.enum';
import { IColumn } from '../../types/column.interface';
import { ITable } from '../../types/table.interface';
import { ColumnTools } from '../../utils/column-tools';
import { commentEncoder } from '../../utils/comment.coder';
import { Reflection } from '../reflection';
import { generateNativeType } from './utils/native-type.generator';

export const createColumn = (
  tableBuilder: Knex.CreateTableBuilder,
  columnName: string,
  columnDesc: IColumn,
  tableDesc: ITable,
  reflection: Reflection,
) => {
  let columnBuilder: Knex.PostgreSqlColumnBuilder;

  if (columnDesc.type.name === ColumnType.ENUM) {
    // Check if the enum native type is already defined
    const nativeType = columnDesc.type.nativeName;

    if (reflection.isTypeExists(nativeType)) {
      // Type name need to be quoted as knex does not checks for case sensitivity and uses it as is
      columnBuilder = tableBuilder.specificType(columnName, `"${nativeType}"`);
    } else {
      columnBuilder = tableBuilder.enum(columnName, columnDesc.type.values, {
        useNative: true,
        existingType: false,
        enumName: nativeType,
      });
    }
  } else if (columnDesc.type.name === ColumnType.JSON) {
    columnBuilder = tableBuilder.json(columnName);
  } else if (columnDesc.type.name === ColumnType.JSONB) {
    columnBuilder = tableBuilder.jsonb(columnName);
  } else {
    columnBuilder = tableBuilder.specificType(
      columnName,
      generateNativeType(columnDesc),
    );
  }

  // Add nullable constraint
  if (columnDesc.isNullable) {
    columnBuilder.nullable();
  } else {
    columnBuilder.notNullable();
  }

  // Add unique constraint
  if (columnDesc.isUnique) {
    columnBuilder.unique();
  }

  // Add index
  if (columnDesc.isIndexed) {
    columnBuilder.index(undefined, {
      indexType: columnDesc.isIndexed,
    });
  }

  // Add primary constraint, only if this is the only primary column
  if (
    columnDesc.isPrimary &&
    ColumnTools.filterPrimary(tableDesc).length === 1
  ) {
    columnBuilder.primary();
  }

  // Add comment for the column
  const comment = commentEncoder(columnDesc);

  if (comment && comment.length > 0) {
    columnBuilder.comment(comment);
  }

  // Add default value
  if (columnDesc.defaultValue !== undefined) {
    let defaultValue = columnDesc.defaultValue;

    if (typeof defaultValue === 'object') {
      defaultValue = JSON.stringify(defaultValue);
    }

    columnBuilder.defaultTo(columnDesc.defaultValue);
  }
};
