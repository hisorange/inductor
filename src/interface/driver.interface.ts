import { Knex } from 'knex';
import { Model, ModelClass } from 'objection';
import { PostgresInspector } from '../driver/postgres/postgres.inspector';
import { PostgresMigrator } from '../driver/postgres/postgres.migrator';
import { ISchema } from './schema.interface';

export interface IDriver {
  validateSchema(schema: ISchema): void;

  readonly inspector: PostgresInspector;
  readonly migrator: PostgresMigrator;
  readonly connection: Knex;

  toModel(schema: ISchema): ModelClass<Model>;

  getDatabaseName(): Promise<string>;
}
