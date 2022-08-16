import { Knex } from 'knex';
import { MigrationRisk } from './migration-risk.enum';
import { IStepResult } from './step-result.interface';

interface IPlanStep {
  query: Knex.SchemaBuilder;
  risk: MigrationRisk;
  description: string;

  /**
   * Migration can be split into numeric phases.
   * With this functionality the actions which depends on other steps can be
   * executed later in time.
   *
   * Example: Foreign keys are created after all tables are created.
   */
  phase: number;
}

export interface IMigrationPlan {
  readonly steps: IPlanStep[];

  getHighestRisk(): MigrationRisk;
  execute(): Promise<IStepResult[]>;
}
