import { Knex } from 'knex';
import { IReflection } from '../../reflection/types/reflection.interface';
import { IMigrationPlan } from './migration-plan.interface';

export interface IMigrationContext {
  knex: Knex;
  reflection: IReflection;
  plan: IMigrationPlan;
}
