import { InvalidBlueprint } from '../../exception/invalid-blueprint.exception';
import { IBlueprint } from '../../interface/blueprint/blueprint.interface';
import { BaseValidator } from '../abstract/base.validator';

export const MySQLValidator = (blueprint: IBlueprint): void => {
  BaseValidator(blueprint);

  // Validate for invalid table names
  if (blueprint.tableName.length > 63) {
    throw new InvalidBlueprint('Table name is too long');
  }

  // Validate for invalid table names characters
  if (!blueprint.tableName.match(/^[_]?[a-zA-Z0-9_]*$/)) {
    throw new InvalidBlueprint('Table name format is invalid');
  }

  // Minimum 1 column is required
  if (Object.keys(blueprint.columns).length === 0) {
    throw new InvalidBlueprint('No columns defined');
  }
};
