import { IBlueprint } from '../../blueprint';
import { IMigrationPlan } from './migration-plan.interface';

export interface IMigrationManager {
  /**
   * Drop the blueprint from the database.
   */
  dropBlueprint(blueprint: IBlueprint): Promise<void>;

  /**
   * Drop the table from the database.
   */
  dropTable(tableName: string): Promise<void>;

  readDatabaseState(filters?: string[]): Promise<IBlueprint[]>;
  compareDatabaseState(blueprints: IBlueprint[]): Promise<IMigrationPlan>;
}
