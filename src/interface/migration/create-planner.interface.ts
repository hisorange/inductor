import { IBlueprint } from '../blueprint';

export interface ICreatePlanner {
  createTable(blueprint: IBlueprint): Promise<void>;
}
