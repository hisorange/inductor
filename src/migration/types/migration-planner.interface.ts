import { ISchema } from '../../schema';
import { IMigrationContext } from './migration-context.interface';

export interface IMigrationPlanner {
  readonly ctx: IMigrationContext;

  createTable(blueprint: ISchema): Promise<void>;
  alterTable(blueprint: ISchema): Promise<void>;
}
