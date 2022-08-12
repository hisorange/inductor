import { Model, ModelClass } from 'objection';
import { IBlueprint } from './blueprint/blueprint.interface';
import { IDriver } from './driver.interface';
import { IMigrationPlan } from './migration/migration-plan.interface';

export interface IInductor {
  /**
   * Apply a new state to the database.
   */
  setState(blueprints: IBlueprint[]): Promise<void>;

  /**
   * Read the database state and return it as a list of blueprints.
   */
  readState(filters?: string[]): Promise<IBlueprint[]>;

  /**
   * Calculate the changes needed to migrate the database to the target state.
   */
  cmpState(blueprints: IBlueprint[]): Promise<IMigrationPlan>;

  /**
   * Get the associated model by it's name.
   *
   * @throws {Error} If the model is not found.
   */
  getModel<T extends Model = Model>(name: string): ModelClass<T>;

  /**
   * Get the database provider specific driver.
   */
  readonly driver: IDriver;
}
