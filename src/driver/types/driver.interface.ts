import EventEmitter2 from 'eventemitter2';
import { Knex } from 'knex';
import { Model, ModelClass } from 'objection';
import { Logger } from 'pino';
import { IBlueprint } from '../../blueprint';
import { IFactCollector } from '../../fact/types/fact-collector.interface';
import { IMigrationManager } from '../../migration/types/migration-manager.interface';
import { IMigrationPlan } from '../../migration/types/migration-plan.interface';
import { IStepResult } from '../../migration/types/step-result.interface';
import { IDatabase } from './database.interface';

export interface IDriver {
  readonly logger: Logger;
  readonly database: IDatabase;
  readonly event: EventEmitter2;
  readonly migrator: IMigrationManager;
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
