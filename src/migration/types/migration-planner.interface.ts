import { ISchema } from '../../schema';
import { IMigrationContext } from './migration-context.interface';

export interface IMigrationPlanner {
  readonly ctx: IMigrationContext;

  createTable(schema: ISchema): Promise<void>;
  alterTable(schema: ISchema): Promise<void>;
}
