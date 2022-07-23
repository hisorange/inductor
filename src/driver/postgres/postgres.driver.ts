import { Knex } from 'knex';
import { Logger } from 'pino';
import { IDriver } from '../../interface/driver.interface';
import { ISchema } from '../../interface/schema.interface';
import { PostgresInspector } from './postgres.inspector';
import { PostgresMigrator } from './postgres.migrator';
import { postgresValidateSchema } from './postgres.schema-validator';

export class PostgresDriver implements IDriver {
  readonly migrator: PostgresMigrator;
  readonly inspector: PostgresInspector;

  constructor(logger: Logger, knex: Knex) {
    this.inspector = new PostgresInspector(knex);
    this.migrator = new PostgresMigrator(logger, this.inspector, knex);
  }

  validateSchema(schema: ISchema) {
    postgresValidateSchema(schema);
  }
}
