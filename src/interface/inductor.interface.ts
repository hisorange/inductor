import { Model, ModelClass } from 'objection';
import { IBlueprint } from './blueprint/blueprint.interface';
import { IDriver } from './driver.interface';
import { IMigrationPlan } from './migration/migration-plan.interface';
import { IStepResult } from './migration/step-result.interface';

export interface IInductor {
  /**
   * Apply a new state to the database.
   */
  migrate(blueprints: IBlueprint[]): Promise<IStepResult[]>;

  /**
   * Read the database state and return it as a list of blueprints.
   */
  reverse(filters?: string[]): Promise<IBlueprint[]>;

  /**
   * Calculate the changes needed to migrate the database to the target state.
   */
  compare(blueprints: IBlueprint[]): Promise<IMigrationPlan>;

  /**
   * Get the associated model by it's name.
   *
   * @throws {Error} If the model is not found.
   */
  model<T extends Model = Model>(name: string): ModelClass<T>;

  /**
   * Instance ID generated at every construction,
   * used for tracing the connections and logs for debugging.
   */
  readonly id: string;

  /**
   * Get the database provider specific driver.
   */
  readonly driver: IDriver;
}
