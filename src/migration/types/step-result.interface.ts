import { MigrationRisk } from './migration-risk.enum';

export interface IStepResult {
  query: string;
  risk: MigrationRisk;
  executionTime: number;
}
