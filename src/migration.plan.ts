import { Logger } from 'pino';
import { IMigrationPlan } from './interface/migration/migration-plan.interface';
import { MigrationRisk } from './interface/migration/migration.risk';

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

  async apply(): Promise<void> {
    if (this.steps.length) {
      this.logger.info('Applying [%d] changes', this.steps.length);

      for (const step of this.steps) {
        const sql = step.query.toQuery();

        if (sql.length) {
          //console.log(step.toString());
          this.logger.debug(sql);
        }

        await step.query;
      }
    }
  }
}
