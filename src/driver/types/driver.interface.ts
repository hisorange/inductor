import { Knex } from 'knex';
import { Model, ModelClass } from 'objection';
import { Migrator } from '../../migration';
import { IMigrationPlan } from '../../migration/types/migration-plan.interface';
import { IStepResult } from '../../migration/types/step-result.interface';
import { IReflection } from '../../reflection/types/reflection.interface';
import { ISchema } from '../../schema';
import { IDatabase } from './database.interface';

export interface IDriver {
  readonly id: string;
  readonly database: IDatabase;
  readonly migrator: Migrator;
  readonly reflection: IReflection;
  readonly knex: Knex;

  setState(blueprints: ISchema[]): Promise<IStepResult[]>;
  readState(filters?: string[]): Promise<ISchema[]>;
  compareState(blueprints: ISchema[]): Promise<IMigrationPlan>;
  getModel<T extends Model = Model>(name: string): ModelClass<T>;
  closeConnection(): Promise<void>;

  getBlueprints(): ISchema[];
  getModels(): ModelClass<Model>[];
}
