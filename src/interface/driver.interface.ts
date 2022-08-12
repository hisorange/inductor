import { Knex } from 'knex';
import { Model, ModelClass } from 'objection';
import { IBlueprint } from './blueprint/blueprint.interface';
import { IDatabase } from './database.interface';
import { IFacts } from './facts.interface';
import { IInspector } from './inspector.interface';
import { IMigrator } from './migrator.interface';

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
   * Validate the blueprint for the database provider
   */
  validateBlueprint(blueprint: IBlueprint): void;

  /**
   * Convert the blueprint into a model class
   */
  toModel(blueprint: IBlueprint): ModelClass<Model>;
}
