import { Model, ModelClass } from 'objection';
import { IBlueprint } from './blueprint/blueprint.interface';

export type BlueprintMap = Map<
  string,
  { blueprint: IBlueprint; model: ModelClass<Model> }
>;
