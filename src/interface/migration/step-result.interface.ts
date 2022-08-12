import { MigrationRisk } from './migration.risk';

export interface IStepResult {
  query: string;
  risk: MigrationRisk;
  executionTime: number;
}
