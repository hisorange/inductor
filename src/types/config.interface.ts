import { Knex } from 'knex';
import { IMeta } from './meta.interface';

/**
 * Describe the database table, and the connection associated with it.
 */
export interface IConfig {
  /**
   * Database connection configuration
   */
  readonly connection: Knex.PgConnectionConfig;

  /**
   * Flag to indicate that the tables are read only,
   * and the database should not be modified.
   */
  readonly isReadOnly: boolean;

  /**
   * List of regex patterns to filter tables from the database.
   * In case it's empty, all tables are returned.
   */
  filters: string[];

  /**
   * List of meta extensions to be used for the database.
   */
  metax?: IMeta[];
}
