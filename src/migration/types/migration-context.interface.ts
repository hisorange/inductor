import { Knex } from 'knex';
import { IFactManager } from '../../fact/types/fact-manager.interface';
import { IMigrationPlan } from './migration-plan.interface';

export interface IMigrationContext {
  knex: Knex;
  factManager: IFactManager;
  migrationPlan: IMigrationPlan;
}
