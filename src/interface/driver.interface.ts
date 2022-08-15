import EventEmitter2 from 'eventemitter2';
import { Knex } from 'knex';
import { Model, ModelClass } from 'objection';
import { IBlueprint } from './blueprint/blueprint.interface';
import { IDatabase } from './database/database.interface';
import { IFactCollector } from './fact/fact-collector.interface';
import { IMigrator } from './migrator.interface';

export interface IDriver {
  /**
   * Associated database
   */
  readonly database: IDatabase;
  readonly event: EventEmitter2;

  /**
   * Migration planner / executer instance
   */
  readonly migrator: IMigrator;
  readonly factCollector: IFactCollector;

  /**
   * Database connection
   */
  readonly connection: Knex;

  /**
   * Validate the blueprint for the database provider
   */
  validateBlueprint(blueprint: IBlueprint): void;

  /**
   * Convert the blueprint into a model class
   */
  toModel(blueprint: IBlueprint): ModelClass<Model>;
}
