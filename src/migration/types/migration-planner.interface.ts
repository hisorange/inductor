import { ITable } from '../../table';
import { IMigrationContext } from './migration-context.interface';

export interface IMigrationPlanner {
  readonly ctx: IMigrationContext;

  createTable(table: ITable): Promise<void>;
  alterTable(table: ITable): Promise<void>;
}
