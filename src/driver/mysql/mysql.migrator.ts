import { IMigrationContext } from '../../interface';
import { IAlterPlanner } from '../../interface/migration/alter-planner.interface';
import { ICreatePlanner } from '../../interface/migration/create-planner.interface';
import { IStateReader } from '../../interface/state-reader.interface';
import { BaseMigrator } from '../base.migrator';
import { MySQLAlterPlanner } from './mysql.alter-planner';
import { MySQLCreatePlanner } from './mysql.create-planner';
import { MySQLStateReader } from './mysql.state-reader';

export class MySQLMigrator extends BaseMigrator {
  createStateReader(): IStateReader {
    return new MySQLStateReader();
  }

  createCreatePlanner(ctx: IMigrationContext): ICreatePlanner {
    return new MySQLCreatePlanner();
  }

  createAlterPlanner(ctx: IMigrationContext): IAlterPlanner {
    return new MySQLAlterPlanner();
  }
}
