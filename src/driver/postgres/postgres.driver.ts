import EventEmitter2 from 'eventemitter2';
import { Logger } from 'pino';
import { FactCollector } from '../../component/fact.collector';
import { IDatabase, IDriver } from '../../interface';
import { IBlueprint } from '../../interface/blueprint/blueprint.interface';
import { DatabaseProvider } from '../../interface/database/database.provider';
import { IFactCollector } from '../../interface/fact/fact-collector.interface';
import { IMigrator } from '../../interface/migrator.interface';
import { SQLBaseDriver } from '../abstract/base.driver';
import { PostgresFactSource } from './postgres.fact-source';
import { PostgresMigrator } from './postgres.migrator';
import { PostgresValidator } from './postgres.validator';

export class PostgresDriver
  extends SQLBaseDriver
  implements IDriver<DatabaseProvider.POSTGRES>
{
  constructor(
    id: string,
    readonly logger: Logger,
    readonly database: IDatabase<DatabaseProvider.POSTGRES>,
    readonly event: EventEmitter2,
  ) {
    super(id, logger, database, event);
  }

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
