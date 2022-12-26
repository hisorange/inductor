import { Model, ModelClass } from 'objection';
import { IBlueprint } from '../../blueprint';
import { ICache } from '../../cache/types/cache.interface';
import { IFactManager } from '../../fact/types/fact-manager.interface';
import { IMigrationManager } from '../../migration/types/migration-manager.interface';
import { IMigrationPlan } from '../../migration/types/migration-plan.interface';
import { IStepResult } from '../../migration/types/step-result.interface';
import { IDatabase } from './database.interface';

export interface IDriver {
  readonly database: IDatabase;
  readonly migrationManager: IMigrationManager;
  readonly factManager: IFactManager;

  setState(blueprints: IBlueprint[]): Promise<IStepResult[]>;
  readState(filters?: string[]): Promise<IBlueprint[]>;
  compareState(blueprints: IBlueprint[]): Promise<IMigrationPlan>;
  getModel<T extends Model = Model>(name: string): ModelClass<T>;
  closeConnection(): Promise<void>;

  getBlueprints(): IBlueprint[];
  getModels(): ModelClass<Model>[];

  getCache(table: string): ICache;
}
