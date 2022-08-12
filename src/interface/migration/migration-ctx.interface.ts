import { Knex } from 'knex';
import { IFactCollector } from '../fact/fact-collector.interface';
import { IMigrationPlan } from './migration-plan.interface';

export interface IMigrationContext {
  knex: Knex;
  facts: IFactCollector;
  plan: IMigrationPlan;
}
