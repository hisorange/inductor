import { InvalidSchema } from '../../exception/invalid-schema.exception';
import { ISchema } from '../../interface/schema/schema.interface';
import { PostgresColumnTools } from './postgres.column-tools';
import { PostgresColumnType } from './postgres.column-type';
import { PostgresIndexType } from './postgres.index-type';

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
      const isSerialType = PostgresColumnTools.isSerialType(definition);

      // Serial columns are always primary
      if (!definition.isPrimary && isSerialType) {
        throw new InvalidSchema(
          `Serial column [${name}] cannot be non-primary`,
        );
      }

      // Nullable columns are automaticaly get a default value of NULL
      if (
        definition.isNullable &&
        typeof definition.defaultValue === 'undefined'
      ) {
        throw new InvalidSchema(
          `Column [${name}] is nullable but has no default value defined`,
        );
      }

      // Serial columns cannot be nullable
      if (definition.isNullable && isSerialType) {
        throw new InvalidSchema(`Column [${name}] cannot be nullable`);
      }

      // Unique is not supported for these types
      if (
        definition.isUnique &&
        !PostgresColumnTools.canTypeBeUnique(definition)
      ) {
        throw new InvalidSchema(`Column [${name}] cannot be unique`);
      }

      // Primary is not supported for these types
      if (
        definition.isPrimary &&
        !PostgresColumnTools.canTypeBePrimary(definition)
      ) {
        throw new InvalidSchema(`Column [${name}] cannot be a primary key`);
      }

      // Primary keys are unique by design
      if (definition.isPrimary && definition.isUnique) {
        throw new InvalidSchema(`Primary column [${name}] cannot be unique`);
      }

      // Primary keys cannot be nullable
      if (definition.isPrimary && definition.isNullable) {
        throw new InvalidSchema(`Primary column [${name}] cannot be nullable`);
      }

      if (definition.type.name === PostgresColumnType.ENUM) {
        // Enumerators only support text values
        if (definition.type.values.some(value => typeof value !== 'string')) {
          throw new InvalidSchema(
            `Enumerated column [${name}] cannot have non string value`,
          );
        }

        // Enumerators have at least one value
        if (definition.type.values.length === 0) {
          throw new InvalidSchema(
            `Enumerated column [${name}] has to define at least one value`,
          );
        }

        // Enumerators cannot have duplicate values
        if (
          definition.type.values.length !== new Set(definition.type.values).size
        ) {
          throw new InvalidSchema(
            `Enumerated column [${name}] cannot have duplicate values`,
          );
        }
      }
    }
  }

  // Validate compositive indexes
  for (const [name, compositiveIndex] of Object.entries(schema.indexes)) {
    if (compositiveIndex.columns.length < 2) {
      throw new InvalidSchema(
        `Compositive index [${name}] must have at least 2 columns`,
      );
    }

    // Cannot have the type hash or spgist
    if (
      compositiveIndex.type === PostgresIndexType.HASH ||
      compositiveIndex.type === PostgresIndexType.SPGIST
    ) {
      throw new InvalidSchema(
        `Compositive index [${name}] cannot have either hash and spgist`,
      );
    }
  }

  // Validate the compositive unique fields for valid types
  for (const uniqueName in schema.uniques) {
    const validColumns: string[] = [];
    const expectedColumns: string[] = [];

    if (Object.prototype.hasOwnProperty.call(schema.uniques, uniqueName)) {
      expectedColumns.push(...schema.uniques[uniqueName].columns);

      for (const columnName of expectedColumns) {
        // Check if the column exists
        if (Object.prototype.hasOwnProperty.call(schema.columns, columnName)) {
          const columnDef = schema.columns[columnName];

          // Check if the column can be unique
          if (PostgresColumnTools.canTypeBeUnique(columnDef)) {
            validColumns.push(columnName);
          }
        }
      }
    }

    // All column has to match
    if (validColumns.length !== expectedColumns.length) {
      throw new InvalidSchema(
        `Composite unique [${uniqueName}] contains invalid columns`,
      );
    }
  }
};
