import EventEmitter2 from 'eventemitter2';
import { Knex } from 'knex';
import { Model, ModelClass } from 'objection';
import { Logger } from 'pino';
import { IBlueprint } from './blueprint/blueprint.interface';
import { IDatabase } from './database/database.interface';
import { DatabaseProvider } from './database/database.provider';
import { IFactCollector } from './fact/fact-collector.interface';
import { IMigrationPlan, IStepResult } from './migration';
import { IMigrator } from './migrator.interface';

export interface IDriver<Provider = DatabaseProvider> {
  readonly logger: Logger;
  readonly database: IDatabase<Provider>;
  readonly event: EventEmitter2;
  readonly migrator: IMigrator;
  readonly factCollector: IFactCollector;
  readonly connection: Knex;
  validateBlueprint(blueprint: IBlueprint): void;
  toModel(blueprint: IBlueprint): ModelClass<Model>;

  migrate(blueprints: IBlueprint[]): Promise<IStepResult[]>;
  reverse(filters?: string[]): Promise<IBlueprint[]>;
  compare(blueprints: IBlueprint[]): Promise<IMigrationPlan>;
  model<T extends Model = Model>(name: string): ModelClass<T>;
  close(): Promise<void>;
}
