import { IBlueprint } from './types';
import { BlueprintKind } from './types/blueprint.kind';

export const initBlueprint = (
  tableName: string,
  type: BlueprintKind = BlueprintKind.TABLE,
): IBlueprint => ({
  tableName,
  kind: type,
  columns: {},
  uniques: {},
  indexes: {},
  relations: {},
});
