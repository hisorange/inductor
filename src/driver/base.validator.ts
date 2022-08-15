import { InvalidBlueprint } from '../exception';
import { IBlueprint } from '../interface';

export const BaseValidator = (blueprint: IBlueprint): void => {
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
};
