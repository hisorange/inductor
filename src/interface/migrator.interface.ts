import { IBlueprint } from './blueprint/blueprint.interface';
import { IMigrationPlan } from './migration/migration-plan.interface';

export interface IMigrator {
  /**
   * Drop the blueprint from the database.
   */
  dropBlueprint(blueprint: IBlueprint): Promise<void>;

  /**
   * Drop the table from the database.
   */
  dropTable(tableName: string): Promise<void>;

  reverse(filters?: string[]): Promise<IBlueprint[]>;
  compare(blueprints: IBlueprint[]): Promise<IMigrationPlan>;
  migrate(blueprints: IBlueprint[]): Promise<void>;
}
