import { FactCollector } from '../../component/fact.collector';
import { IBlueprint } from '../../interface';
import { BaseDriver } from '../abstract/base.driver';
import { MySQLFactSource } from './mysql.fact-source';
import { MySQLMigrator } from './mysql.migrator';

export class MySQLDriver extends BaseDriver {
  createMigrator() {
    return new MySQLMigrator(this.logger, this.connection, this.factCollector);
  }

  createFactCollector() {
    return new FactCollector(new MySQLFactSource(this.connection));
  }

  validateBlueprint(blueprint: IBlueprint): void {}
}
