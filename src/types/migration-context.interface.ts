import { Knex } from 'knex';
import { Plan } from '../library/plan';
import { Reflection } from '../library/reflection';
import { IMeta } from './meta.interface';

export interface IMigrationContext {
  knex: Knex;
  reflection: Reflection;
  plan: Plan;
  metas: IMeta[];
}
