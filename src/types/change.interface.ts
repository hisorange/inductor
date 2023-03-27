import { IMigrationContext } from './migration-context.interface';
import { ITable } from './table.interface';

export interface IChange {
  context: IMigrationContext;
  target: ITable;
  current: ITable;
  isPrimaryChanged: boolean;
}
