import { FactCollector } from '../../component/fact.collector';
import { IBlueprint } from '../../interface/blueprint/blueprint.interface';
import { IFactCollector } from '../../interface/fact/fact-collector.interface';
import { IMigrator } from '../../interface/migrator.interface';
import { BaseDriver } from '../base.driver';
import { PostgresFactSource } from './postgres.fact-source';
import { PostgresMigrator } from './postgres.migrator';
import { PostgresValidator } from './postgres.validator';

export class PostgresDriver extends BaseDriver {
  createMigrator(): IMigrator {
    return new PostgresMigrator(
      this.logger,
      this.connection,
      this.factCollector,
    );
  }

  createFactCollector(): IFactCollector {
    return new FactCollector(new PostgresFactSource(this.connection));
  }

  validateBlueprint(blueprint: IBlueprint) {
    PostgresValidator(blueprint);
  }
}
