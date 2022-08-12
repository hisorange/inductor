import { Logger } from 'pino';
import { IMigrationPlan } from './interface/migration/migration-plan.interface';
import { MigrationRisk } from './interface/migration/migration.risk';
import { IStepResult } from './interface/migration/step-result.interface';

export class MigrationPlan implements IMigrationPlan {
  readonly steps: IMigrationPlan['steps'] = [];

  constructor(readonly logger: Logger) {}

  getHighestRisk(): MigrationRisk {
    let highestRisk = MigrationRisk.NONE;

    for (const step of this.steps) {
      if (step.risk === MigrationRisk.HIGH) {
        return MigrationRisk.HIGH;
      }

      if (step.risk === MigrationRisk.MEDIUM) {
        highestRisk = MigrationRisk.MEDIUM;
      }

      if (step.risk === MigrationRisk.LOW) {
        if (highestRisk === MigrationRisk.NONE) {
          highestRisk = MigrationRisk.LOW;
        }
      }
    }

    return highestRisk;
  }

  explain(): void {
    if (this.steps.length) {
      this.logger.info('Applying [%d] changes', this.steps.length);

      for (const [idx, step] of this.steps
        .sort((a, b) => (a.phase > b.phase ? 0 : -1))
        .entries()) {
        const startedAt = Date.now();
        const sql = step.query.toString();

        if (sql.length) {
          console.log(
            [
              `[P:${step.phase}]`,
              `[${idx + 1}/${this.steps.length}]`,
              `[${step.risk.toUpperCase()}]`,
              step.description,
              '\n ---- \t',
              sql,
            ].join(' '),
          );
        }
      }
    }
  }

  async apply(): Promise<IStepResult[]> {
    const results = [];
    this.explain();

    if (this.steps.length) {
      this.logger.info('Applying [%d] changes', this.steps.length);

      for (const [idx, step] of this.steps
        .sort((a, b) => (a.phase > b.phase ? 0 : -1))
        .entries()) {
        const startedAt = Date.now();
        const sql = step.query.toString();

        results.push({
          query: sql,
          risk: step.risk,
          executionTime: Date.now() - startedAt,
          order: idx + 1,
        });

        await step.query;
      }
    }

    return results;
  }
}
