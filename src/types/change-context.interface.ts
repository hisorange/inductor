import { IMigrationContext } from './migration-context.interface';
import { ITable } from './table.interface';

export interface ChangeContext {
  ctx: IMigrationContext;
  target: ITable;
  current: ITable;
}
