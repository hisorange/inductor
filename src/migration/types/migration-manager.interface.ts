import { IBlueprint } from '../../blueprint';
import { IFactCollector } from '../../fact/types/fact-collector.interface';
import { IMigrationPlan } from './migration-plan.interface';

export interface IMigrationManager {
  readonly facts: IFactCollector;

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
}
