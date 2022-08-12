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

  readState(filters?: string[]): Promise<IBlueprint[]>;
  cmpState(blueprints: IBlueprint[]): Promise<IMigrationPlan>;
  setState(blueprints: IBlueprint[]): Promise<void>;
}
