import EventEmitter2 from 'eventemitter2';
import { Logger } from 'pino';
import { FactCollector } from '../../component/fact.collector';
import { IBlueprint } from '../../interface/blueprint/blueprint.interface';
import { IDatabase } from '../../interface/database/database.interface';
import { IFactCollector } from '../../interface/fact/fact-collector.interface';
import { IMigrator } from '../../interface/migrator.interface';
import { BaseDriver } from '../base.driver';
import { PostgresFactSource } from './postgres.fact-source';
import { PostgresMigrator } from './postgres.migrator';
import { PostgresValidator } from './postgres.validator';

export class PostgresDriver extends BaseDriver {
  readonly migrator: IMigrator;
  readonly factCollector: IFactCollector;

  constructor(
    id: string,
    readonly logger: Logger,
    readonly database: IDatabase,
    readonly event: EventEmitter2,
  ) {
    super(id, database, event);

    this.factCollector = new FactCollector(
      new PostgresFactSource(this.connection),
    );
    this.migrator = new PostgresMigrator(
      logger,
      this.connection,
      this.factCollector,
    );
  }

  validateBlueprint(blueprint: IBlueprint) {
    PostgresValidator(blueprint);
  }
}
