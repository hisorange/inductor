import { Model, ModelClass } from 'objection';
import { IDriver } from './driver.interface';
import { ISchema } from './schema/schema.interface';

export interface IInductor {
  /**
   * Apply a new state to the database.
   */
  setState(schemas: ISchema[]): Promise<void>;

  /**
   * Read the database state and return it as a list of schemas.
   */
  readState(): Promise<ISchema[]>;

  /**
   * Calculate the changes needed to migrate the database to the target state.
   */
  cmpState(schemas: ISchema[]): Promise<string[]>;

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
