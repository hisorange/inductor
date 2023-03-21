import { Knex } from 'knex';
import { Plan } from '../library/plan';
import { Reflection } from '../library/reflection';

export interface IMigrationContext {
  knex: Knex;
  reflection: Reflection;
  plan: Plan;
}
