import { Logger } from 'pino';
import { ImpossibleMigration } from '../exception/impossible-migration.exception';
import { IPlanStep } from '../types/migration-plan.interface';
import { MigrationRisk } from '../types/migration-risk.enum';
import { IStepResult } from '../types/step-result.interface';

export class Plan {
  readonly steps: IPlanStep[] = [];

  constructor(readonly logger: Logger) {}

  getHighestRisk(): MigrationRisk {
    let highestRisk = MigrationRisk.NONE;

    for (const step of this.steps) {
      if (step.risk === MigrationRisk.IMPOSSIBLE) {
        return MigrationRisk.IMPOSSIBLE;
      }
      if (step.risk === MigrationRisk.HIGH) {
        highestRisk = MigrationRisk.HIGH;
      }

      if (step.risk === MigrationRisk.MEDIUM) {
        if (highestRisk !== MigrationRisk.HIGH) {
          highestRisk = MigrationRisk.MEDIUM;
        }
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
      for (const [idx, step] of this.steps
        .sort((a, b) => (a.phase > b.phase ? 0 : -1))
        .entries()) {
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

  async execute(): Promise<IStepResult[]> {
    const results = [];

    if (this.steps.length) {
      this.explain();

      if (this.getHighestRisk() === MigrationRisk.IMPOSSIBLE) {
        throw new ImpossibleMigration(
          'Migration plan contains impossible step(s)',
        );
      }

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
