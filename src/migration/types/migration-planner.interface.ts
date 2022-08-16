import { IBlueprint } from '../../blueprint';
import { IMigrationContext } from './migration-context.interface';

export interface IMigrationPlanner {
  readonly ctx: IMigrationContext;

  createTable(blueprint: IBlueprint): Promise<void>;
  alterTable(blueprint: IBlueprint): Promise<void>;
}
