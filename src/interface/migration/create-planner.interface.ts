import { IBlueprint } from '../blueprint';
import { IMigrationContext } from './migration-ctx.interface';

export interface ICreatePlanner {
  readonly ctx: IMigrationContext;

  createTable(blueprint: IBlueprint): Promise<void>;
}
