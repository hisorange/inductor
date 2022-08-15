import { IMigrationContext } from '../../interface';
import { IMigrator } from '../../interface/migrator.interface';
import { IStateReader } from '../../interface/state-reader.interface';
import { BaseMigrator } from '../base.migrator';
import { PostgresAlterPlanner } from './migrator/alter.planner';
import { PostgresCreatePlanner } from './migrator/create.planner';
import { PostgresStateReader } from './postgres.state-reader';

// Calculates and applies the changes on the database
export class PostgresMigrator extends BaseMigrator implements IMigrator {
  createStateReader(): IStateReader {
    return new PostgresStateReader(this.facts);
  }

  createCreatePlanner(ctx: IMigrationContext): PostgresCreatePlanner {
    return new PostgresCreatePlanner(ctx);
  }

  createAlterPlanner(ctx: IMigrationContext): PostgresAlterPlanner {
    return new PostgresAlterPlanner(ctx);
  }
}
