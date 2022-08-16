import { InvalidBlueprint } from '../exception/invalid-blueprint.exception';
import { ColumnTools } from '../tools/column-tools';
import { IBlueprint } from './types';
import { ColumnType } from './types/column-type.enum';
import { IndexType } from './types/index-type.enum';

export const validateBlueprint = (blueprint: IBlueprint): void => {
  // Validate the table name, or it's just spaces
  if (!blueprint.tableName || blueprint.tableName.trim().length === 0) {
    throw new InvalidBlueprint('Missing table name');
  }

  const columnNames = Object.keys(blueprint.columns);

  // Validate composite indexes
  for (const [name, compositeIndex] of Object.entries(blueprint.indexes)) {
    if (compositeIndex.columns.length < 2) {
      throw new InvalidBlueprint(
        `Composite index [${name}] must have at least 2 columns`,
      );
    }

    for (const column of compositeIndex.columns) {
      if (!columnNames.includes(column)) {
        throw new InvalidBlueprint(
          `Composite index [${name}] references a column that does not exist`,
        );
      }
    }
  }

  // Validate composite unique
  for (const [name, compositeUnique] of Object.entries(blueprint.uniques)) {
    if (compositeUnique.columns.length < 2) {
      throw new InvalidBlueprint(
        `Composite unique [${name}] must have at least 2 columns`,
      );
    }

    for (const column of compositeUnique.columns) {
      if (!columnNames.includes(column)) {
        throw new InvalidBlueprint(
          `Composite unique [${name}] references a column that does not exist`,
        );
      }
    }
  }

  // Validate for invalid table names
  if (blueprint.tableName.length > 63) {
    throw new InvalidBlueprint('Table name is too long');
  }

  // Validate for invalid table names characters
  if (!blueprint.tableName.match(/^[_]?[a-zA-Z0-9_]*$/)) {
    throw new InvalidBlueprint('Table name format is invalid');
  }

  for (const name in blueprint.columns) {
    if (Object.prototype.hasOwnProperty.call(blueprint.columns, name)) {
      const definition = blueprint.columns[name];
      const isSerialType = ColumnTools.isSerialType(definition);

      // Serial columns are always primary
      if (!definition.isPrimary && isSerialType) {
        throw new InvalidBlueprint(
          `Serial column [${name}] cannot be non-primary`,
        );
      }

      // Nullable columns are automaticaly get a default value of NULL
      if (
        definition.isNullable &&
        typeof definition.defaultValue === 'undefined'
      ) {
        throw new InvalidBlueprint(
          `Column [${name}] is nullable but has no default value defined`,
        );
      }

      // Serial columns cannot be nullable
      if (definition.isNullable && isSerialType) {
        throw new InvalidBlueprint(`Column [${name}] cannot be nullable`);
      }

      // Unique is not supported for these types
      if (definition.isUnique && !ColumnTools.canTypeBeUnique(definition)) {
        throw new InvalidBlueprint(`Column [${name}] cannot be unique`);
      }

      // Primary is not supported for these types
      if (definition.isPrimary && !ColumnTools.canTypeBePrimary(definition)) {
        throw new InvalidBlueprint(`Column [${name}] cannot be a primary key`);
      }

      // Primary keys are unique by design
      if (definition.isPrimary && definition.isUnique) {
        throw new InvalidBlueprint(`Primary column [${name}] cannot be unique`);
      }

      // Primary keys cannot be nullable
      if (definition.isPrimary && definition.isNullable) {
        throw new InvalidBlueprint(
          `Primary column [${name}] cannot be nullable`,
        );
      }

      if (definition.type.name === ColumnType.ENUM) {
        // Enumerators only support text values
        if (definition.type.values.some(value => typeof value !== 'string')) {
          throw new InvalidBlueprint(
            `Enumerated column [${name}] cannot have non string value`,
          );
        }

        // Enumerators have at least one value
        if (definition.type.values.length === 0) {
          throw new InvalidBlueprint(
            `Enumerated column [${name}] has to define at least one value`,
          );
        }

        // Enumerators cannot have duplicate values
        if (
          definition.type.values.length !== new Set(definition.type.values).size
        ) {
          throw new InvalidBlueprint(
            `Enumerated column [${name}] cannot have duplicate values`,
          );
        }
      }
    }
  }

  // Validate composite indexes
  for (const [name, compositeIndex] of Object.entries(blueprint.indexes)) {
    // Cannot have the type hash or spgist
    if (
      compositeIndex.type === IndexType.HASH ||
      compositeIndex.type === IndexType.SPGIST
    ) {
      throw new InvalidBlueprint(
        `Composite index [${name}] cannot have either hash and spgist`,
      );
    }
  }

  // Validate the composite unique fields for valid types
  for (const uniqueName in blueprint.uniques) {
    const validColumns: string[] = [];
    const expectedColumns: string[] = [];

    if (Object.prototype.hasOwnProperty.call(blueprint.uniques, uniqueName)) {
      expectedColumns.push(...blueprint.uniques[uniqueName].columns);

      for (const columnName of expectedColumns) {
        // Check if the column exists
        if (
          Object.prototype.hasOwnProperty.call(blueprint.columns, columnName)
        ) {
          const columnDef = blueprint.columns[columnName];

          // Check if the column can be unique
          if (ColumnTools.canTypeBeUnique(columnDef)) {
            validColumns.push(columnName);
          }
        }
      }
    }

    // All column has to match
    if (validColumns.length !== expectedColumns.length) {
      throw new InvalidBlueprint(
        `Composite unique [${uniqueName}] contains invalid columns`,
      );
    }
  }
};
