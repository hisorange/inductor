import { IBlueprint } from '../interface/blueprint/blueprint.interface';
import { BlueprintKind } from '../interface/blueprint/blueprint.kind';

export const createBlueprint = (
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
