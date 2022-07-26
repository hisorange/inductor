import { Knex } from 'knex';
import { Model, ModelClass } from 'objection';
import { PostgresInspector } from '../driver/postgres/postgres.inspector';
import { PostgresMigrator } from '../driver/postgres/postgres.migrator';
import { IDatabase } from './database.interface';
import { ISchema } from './schema.interface';

export interface IDriver {
  /**
   * Associated database
   */
  readonly database: IDatabase;

  /**
   * Database inspector's instance
   */
  readonly inspector: PostgresInspector;

  /**
   * Migration planner / executer instance
   */
  readonly migrator: PostgresMigrator;

  /**
   * Database connection
   */
  readonly connection: Knex;

  /**
   * Validate the schema for the database provider
   */
  validateSchema(schema: ISchema): void;

  /**
   * Convert the schema into a model class
   */
  toModel(schema: ISchema): ModelClass<Model>;
}
