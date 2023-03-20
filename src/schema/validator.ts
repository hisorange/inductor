import { InvalidSchema } from '../exception/invalid-schema.exception';
import { ColumnTools } from '../tools/column-tools';
import { ISchema } from './types';
import { ColumnType } from './types/column-type.enum';
import { IndexType } from './types/index-type.enum';

export const ValidateSchema = (schema: ISchema): void => {
  // Validate the table name, or it's just spaces
  if (!schema.tableName || schema.tableName.trim().length === 0) {
    throw new InvalidSchema('Missing table name');
  }

  const columnNames = Object.keys(schema.columns);

  // Validate composite indexes
  for (const [name, compositeIndex] of Object.entries(schema.indexes)) {
    if (compositeIndex.columns.length < 2) {
      throw new InvalidSchema(
        `Composite index [${name}] must have at least 2 columns`,
      );
    }

    for (const column of compositeIndex.columns) {
      if (!columnNames.includes(column)) {
        throw new InvalidSchema(
          `Composite index [${name}] references a column that does not exist`,
        );
      }
    }
  }

  // Validate composite unique
  for (const [name, compositeUnique] of Object.entries(schema.uniques)) {
    if (compositeUnique.columns.length < 2) {
      throw new InvalidSchema(
        `Composite unique [${name}] must have at least 2 columns`,
      );
    }

    for (const column of compositeUnique.columns) {
      if (!columnNames.includes(column)) {
        throw new InvalidSchema(
          `Composite unique [${name}] references a column that does not exist`,
        );
      }
    }
  }

  // Validate for invalid table names
  if (schema.tableName.length > 63) {
    throw new InvalidSchema('Table name is too long');
  }

  // Validate for invalid table names characters
  if (!schema.tableName.match(/^[_]?[a-zA-Z0-9_]*$/)) {
    throw new InvalidSchema('Table name format is invalid');
  }

  for (const name in schema.columns) {
    if (Object.prototype.hasOwnProperty.call(schema.columns, name)) {
      const definition = schema.columns[name];
      const isSerialType = ColumnTools.isSerialType(definition);

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
      if (definition.isUnique && !ColumnTools.canTypeBeUnique(definition)) {
        throw new InvalidSchema(`Column [${name}] cannot be unique`);
      }

      // Primary is not supported for these types
      if (definition.isPrimary && !ColumnTools.canTypeBePrimary(definition)) {
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

      if (definition.type.name === ColumnType.ENUM) {
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

  // Validate composite indexes
  for (const [name, compositeIndex] of Object.entries(schema.indexes)) {
    // Cannot have the type hash or spgist
    if (
      compositeIndex.type === IndexType.HASH ||
      compositeIndex.type === IndexType.SPGIST
    ) {
      throw new InvalidSchema(
        `Composite index [${name}] cannot have either hash and spgist`,
      );
    }
  }

  // Validate the composite unique fields for valid types
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
          if (ColumnTools.canTypeBeUnique(columnDef)) {
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
