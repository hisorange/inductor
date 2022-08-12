import { Knex } from 'knex';
import { Model, ModelClass } from 'objection';
import { IDatabase } from './database.interface';
import { IFacts } from './facts.interface';
import { IInspector } from './inspector.interface';
import { IMigrator } from './migrator.interface';
import { ISchema } from './schema/schema.interface';

export interface IDriver {
  /**
   * Associated database
   */
  readonly database: IDatabase;

  /**
   * Database inspector's instance
   */
  readonly inspector: IInspector;

  /**
   * Migration planner / executer instance
   */
  readonly migrator: IMigrator;

  readonly facts: IFacts;

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
