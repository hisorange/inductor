import { IMigrationPlan } from './migration/migration-plan.interface';
import { ISchema } from './schema/schema.interface';

export interface IMigrator {
  dropSchema(schema: ISchema): Promise<void>;
  dropTable(tableName: string): Promise<void>;

  readState(filters?: string[]): Promise<ISchema[]>;
  cmpState(schemas: ISchema[]): Promise<IMigrationPlan>;
  setState(schemas: ISchema[]): Promise<void>;
}
