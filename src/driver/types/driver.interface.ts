import { Knex } from 'knex';
import { Model, ModelClass } from 'objection';
import { Migrator } from '../../migration';
import { IMigrationPlan } from '../../migration/types/migration-plan.interface';
import { IStepResult } from '../../migration/types/step-result.interface';
import { IReflection } from '../../reflection/types/reflection.interface';
import { ITable } from '../../table';
import { IDatabase } from './database.interface';

export interface IDriver {
  readonly id: string;
  readonly database: IDatabase;
  readonly migrator: Migrator;
  readonly reflection: IReflection;
  readonly knex: Knex;

  setState(tables: ITable[]): Promise<IStepResult[]>;
  readState(filters?: string[]): Promise<ITable[]>;
  compareState(tables: ITable[]): Promise<IMigrationPlan>;
  getModel<T extends Model = Model>(name: string): ModelClass<T>;
  closeConnection(): Promise<void>;

  getTableDescriptors(): ITable[];
  getModels(): ModelClass<Model>[];
}
