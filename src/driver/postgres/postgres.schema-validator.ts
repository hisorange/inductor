import { InvalidSchema } from '../../exception/invalid-schema.exception';
import { ISchema } from '../../interface/schema.interface';
import { PostgresColumnType } from './postgres.column-type';

const cannotBePrimary = [
  PostgresColumnType.BOX,
  PostgresColumnType.CIRCLE,
  PostgresColumnType.JSON,
  PostgresColumnType.LINE,
  PostgresColumnType.LSEG,
  PostgresColumnType.PATH,
  PostgresColumnType.PG_SNAPSHOT,
  PostgresColumnType.POINT,
  PostgresColumnType.POLYGON,
  PostgresColumnType.TXID_SNAPSHOT,
  PostgresColumnType.XML,
];

const cannotBeUnique = [
  PostgresColumnType.BOX,
  PostgresColumnType.CIRCLE,
  PostgresColumnType.JSON,
  PostgresColumnType.JSONB,
  PostgresColumnType.LINE,
  PostgresColumnType.LSEG,
  PostgresColumnType.PATH,
  PostgresColumnType.PG_SNAPSHOT,
  PostgresColumnType.POINT,
  PostgresColumnType.POLYGON,
  PostgresColumnType.TXID_SNAPSHOT,
  PostgresColumnType.XML,
  // Serial types cannot be unique as those are primary keys
  PostgresColumnType.SMALLSERIAL,
  PostgresColumnType.SERIAL,
  PostgresColumnType.BIGSERIAL,
];

export const postgresValidateSchema = (schema: ISchema): void => {
  // Validate the table name, or it's just spaces
  if (!schema.tableName || schema.tableName.trim().length === 0) {
    throw new InvalidSchema('Missing table name');
  }

  // Has to have at least one column
  if (!Object.keys(schema.columns).length) {
    throw new InvalidSchema('Mininum one column is required');
  }

  for (const name in schema.columns) {
    if (Object.prototype.hasOwnProperty.call(schema.columns, name)) {
      const definition = schema.columns[name];
      const isSerialType = [
        PostgresColumnType.BIGSERIAL,
        PostgresColumnType.SERIAL,
        PostgresColumnType.SMALLSERIAL,
      ].includes(definition.type);

      // Serial columns are always primary
      if (!definition.isPrimary && isSerialType) {
        throw new InvalidSchema(
          `Serial column [${name}] cannot be non-primary`,
        );
      }

      // Primary keys cannot be nullable
      if (definition.isPrimary && definition.isNullable) {
        throw new InvalidSchema(`Primary column [${name}] cannot be nullable`);
      }

      // Serial columns cannot be nullable
      if (definition.isNullable && isSerialType) {
        throw new InvalidSchema(`Column [${name}] cannot be nullable`);
      }

      // Unique is not supported for these types
      if (definition.isUnique && cannotBeUnique.includes(definition.type)) {
        throw new InvalidSchema(`Column [${name}] cannot be unique`);
      }

      // Primary is not supported for these types
      if (definition.isPrimary && cannotBePrimary.includes(definition.type)) {
        throw new InvalidSchema(`Column [${name}] cannot be a primary key`);
      }

      // Primary keys are unique by design
      if (definition.isPrimary && definition.isUnique) {
        throw new InvalidSchema(`Primary column [${name}] cannot be unique`);
      }
    }
  }

  // Validate the compositive unique fields for valid types
  for (const name in schema.uniques) {
    const validColumns: string[] = [];
    const expectedColumns: string[] = [];

    if (Object.prototype.hasOwnProperty.call(schema.uniques, name)) {
      expectedColumns.push(...schema.uniques[name]);

      for (const columnName of expectedColumns) {
        // Check if the column exists
        if (Object.prototype.hasOwnProperty.call(schema.columns, columnName)) {
          const columnDef = schema.columns[columnName];

          // Check if the column can be unique
          if (!cannotBeUnique.includes(columnDef.type)) {
            validColumns.push(columnName);
          }
        }
      }
    }

    // All column has to match
    if (validColumns.length !== expectedColumns.length) {
      throw new InvalidSchema(
        `Composite unique [${name}] contains invalid columns`,
      );
    }
  }
};
