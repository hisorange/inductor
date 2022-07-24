import { IColumn } from '../../../interface/column.interface';
import { ISchema } from '../../../interface/schema.interface';
import { PostgresColumnType } from '../postgres.column-type';
import { PostgresInspector } from '../postgres.inspector';
import { postgresValidateSchema } from '../postgres.schema-validator';

export const reverseTable = async (
  inspector: PostgresInspector,
  table: string,
) => {
  const schema: ISchema = {
    tableName: table,
    kind: 'table',
    columns: {},
    uniques: {},
    indexes: {},
  };
  const columns = await inspector.columnInfo(table);
  const compositivePrimaryKeys = await inspector.getCompositePrimaryKeys(table);
  const compositiveUniques = await inspector.getCompositeUniques(table);
  const indexes = await inspector.getIndexes(table);

  const singleColumnIndexes = indexes.filter(
    index => index.columns.length === 1,
  );

  // Merge compositive uniques into the schema, but remove the table prefix from the name
  for (const [name, uniques] of Object.entries(compositiveUniques)) {
    const unprefixedName = name.replace(`${table}_`, '');
    schema.uniques[unprefixedName] = uniques;
  }

  for (const column of columns) {
    let type = column.data_type as PostgresColumnType;

    // Determine if the column is a serial
    if (
      typeof column?.default_value === 'string' &&
      column.default_value.startsWith('nextval')
    ) {
      switch (type) {
        case PostgresColumnType.SMALLINT:
          type = PostgresColumnType.SMALLSERIAL;
          break;
        case PostgresColumnType.INTEGER:
          type = PostgresColumnType.SERIAL;
          break;
        case PostgresColumnType.BIGINT:
          type = PostgresColumnType.BIGSERIAL;
          break;
      }
    }

    let isPrimary = column.is_primary_key;
    const isSerial = isSerialType(type);

    // Determine if the column is a compositive primary key
    if (isSerial || compositivePrimaryKeys.includes(column.name)) {
      isPrimary = true;
    }

    // Primary/serial cannot be unique or nullable
    if (isPrimary || isSerial) {
      column.is_nullable = false;
      column.is_unique = false;
    }

    let isIndexed: IColumn['isIndexed'] = false;

    const singleColumnIndex = singleColumnIndexes.find(index =>
      index.columns.includes(column.name),
    );

    // Determine if the column is an index
    if (singleColumnIndex) {
      isIndexed = singleColumnIndex.type;
    }

    schema.columns[column.name] = {
      type,
      kind: 'column',
      isNullable: column.is_nullable,
      isUnique: column.is_unique,
      isPrimary,
      isIndexed,
    };
  }

  postgresValidateSchema(schema);

  return schema;
};

const isSerialType = (type: PostgresColumnType) => {
  switch (type) {
    case PostgresColumnType.SMALLSERIAL:
    case PostgresColumnType.SERIAL:
    case PostgresColumnType.BIGSERIAL:
      return true;
    default:
      return false;
  }
};
