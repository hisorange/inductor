import { Knex } from 'knex';
import { ColumnType } from '../../types/column-type.enum';
import { IColumn } from '../../types/column.interface';
import { IMetaExtension } from '../../types/meta-coder.interface';
import { ITable } from '../../types/table.interface';
import { ColumnTools } from '../../utils/column-tools';
import { encodeMetaComment } from '../../utils/meta.coder';
import { Reflection } from '../reflection';
import { generateNativeType } from './utils/native-type.generator';

export const createColumn = (
  tableBuilder: Knex.CreateTableBuilder,
  columnName: string,
  columnDef: IColumn,
  tableDesc: ITable,
  reflection: Reflection,
  metax: IMetaExtension[],
) => {
  let columnBuilder: Knex.PostgreSqlColumnBuilder;

  if (columnDef.type.name === ColumnType.ENUM) {
    // Check if the enum native type is already defined
    const nativeType = columnDef.type.nativeName;

    if (reflection.isTypeExists(nativeType)) {
      // Type name need to be quoted as knex does not checks for case sensitivity and uses it as is
      columnBuilder = tableBuilder.specificType(columnName, `"${nativeType}"`);
    } else {
      columnBuilder = tableBuilder.enum(columnName, columnDef.type.values, {
        useNative: true,
        existingType: false,
        enumName: nativeType,
      });
    }
  } else if (columnDef.type.name === ColumnType.JSON) {
    columnBuilder = tableBuilder.json(columnName);
  } else if (columnDef.type.name === ColumnType.JSONB) {
    columnBuilder = tableBuilder.jsonb(columnName);
  } else {
    columnBuilder = tableBuilder.specificType(
      columnName,
      generateNativeType(columnDef),
    );
  }

  // Add nullable constraint
  if (columnDef.isNullable) {
    columnBuilder.nullable();
  } else {
    columnBuilder.notNullable();
  }

  // Add unique constraint
  if (columnDef.isUnique) {
    columnBuilder.unique();
  }

  // Add index
  if (columnDef.isIndexed) {
    columnBuilder.index(undefined, {
      indexType: columnDef.isIndexed,
    });
  }

  // Add primary constraint, only if this is the only primary column
  if (
    columnDef.isPrimary &&
    ColumnTools.filterPrimary(tableDesc).length === 1
  ) {
    columnBuilder.primary();
  }

  const comment = {};

  // Apply meta extensions interested in the column
  metax
    .filter(meta => meta.interest === 'column')
    .forEach(meta => meta.onWrite(comment, columnDef.meta));

  // Decode column comment object
  columnBuilder.comment(encodeMetaComment(comment));

  // Add default value
  if (columnDef.defaultValue !== undefined) {
    let defaultValue = columnDef.defaultValue;

    if (typeof defaultValue === 'object') {
      defaultValue = JSON.stringify(defaultValue);
    }

    columnBuilder.defaultTo(columnDef.defaultValue);
  }
};
