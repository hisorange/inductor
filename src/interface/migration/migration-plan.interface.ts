import { Knex } from 'knex';
import { MigrationRisk } from './migration.risk';

interface IPlanStep {
  query: Knex.SchemaBuilder;
  risk: MigrationRisk;
  description: string;
}

export interface IMigrationPlan {
  readonly steps: IPlanStep[];

  getHighestRisk(): MigrationRisk;
  apply(): Promise<void>;
}
