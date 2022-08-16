import { InvalidBlueprint } from '../../exception/invalid-blueprint.exception';
import { IBlueprint } from '../../interface/blueprint/blueprint.interface';
import { PostgresColumnType } from '../../interface/blueprint/postgres/postgres.column-type';
import { PostgresIndexType } from '../../interface/blueprint/postgres/postgres.index-type';
import { SQLBaseValidator } from '../abstract/base.validator';
import { PostgresColumnTools } from './postgres.column-tools';

export const PostgresValidator = (blueprint: IBlueprint): void => {
  SQLBaseValidator(blueprint);

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
      const isSerialType = PostgresColumnTools.isSerialType(definition);

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
      if (
        definition.isUnique &&
        !PostgresColumnTools.canTypeBeUnique(definition)
      ) {
        throw new InvalidBlueprint(`Column [${name}] cannot be unique`);
      }

      // Primary is not supported for these types
      if (
        definition.isPrimary &&
        !PostgresColumnTools.canTypeBePrimary(definition)
      ) {
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

      if (definition.type.name === PostgresColumnType.ENUM) {
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
      compositeIndex.type === PostgresIndexType.HASH ||
      compositeIndex.type === PostgresIndexType.SPGIST
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
          if (PostgresColumnTools.canTypeBeUnique(columnDef)) {
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
