import { Knex } from 'knex';
import { IFacts } from '../facts.interface';
import { IMigrationPlan } from './migration-plan.interface';

export interface IMigrationContext {
  knex: Knex;
  facts: IFacts;
  plan: IMigrationPlan;
}
