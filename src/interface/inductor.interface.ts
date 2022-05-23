import { Model, ModelClass } from 'objection';
import { ISchema } from './schema.interface';

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
   * Get the associated model by it's name.
   *
   * @throws {Error} If the model is not found.
   */
  getModel<T extends Model = Model>(name: string): ModelClass<T>;
}
