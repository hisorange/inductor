import { IBlueprint } from '../blueprint';

export interface IAlterPlanner {
  alterTable(blueprint: IBlueprint): Promise<void>;
}
