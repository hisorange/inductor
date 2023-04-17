import { Knex } from 'knex';
import { Plan } from '../library/plan';
import { Reflection } from '../library/reflection';
import { IMetaExtension } from './meta-coder.interface';

export interface IMigrationContext {
  knex: Knex;
  reflection: Reflection;
  plan: Plan;
  meta: IMetaExtension[];
}
