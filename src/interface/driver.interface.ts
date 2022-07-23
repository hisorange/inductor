import { PostgresInspector } from '../driver/postgres/postgres.inspector';
import { PostgresMigrator } from '../driver/postgres/postgres.migrator';
import { ISchema } from './schema.interface';

export interface IDriver {
  validateSchema(schema: ISchema): void;

  readonly inspector: PostgresInspector;
  readonly migrator: PostgresMigrator;
}
