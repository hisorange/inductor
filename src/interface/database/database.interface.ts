import { Knex } from 'knex';
import { IBlueprint } from '../blueprint/blueprint.interface';
import { DatabaseProvider } from './database.provider';

/**
 * Describe the database blueprint, and the connection associated with it.
 */
export interface IDatabase<
  DatabaseMeta = unknown,
  BlueprintMeta = unknown,
  ColumnMeta = unknown,
> {
  /**
   * Indicates which driver is used to connect to the database,
   * and which model is used to interact with the blueprints.
   */
  readonly provider: DatabaseProvider;

  /**
   * Database connection configuration
   */
  readonly connection: Knex.PgConnectionConfig;

  /**
   * Flag to indicate that the blueprints are read only,
   * and the database should not be modified.
   */
  readonly isReadOnly: boolean;

  /**
   * blueprints associated with the database
   */
  blueprints: {
    [blueprintRef: string]: IBlueprint<BlueprintMeta, ColumnMeta>;
  };

  /**
   * List of regex patterns to filter blueprints from the database.
   * In case it's empty, all blueprints are returned.
   */
  filters: string[];

  /**
   * Associated metadata with the database
   */
  meta?: DatabaseMeta;
}
