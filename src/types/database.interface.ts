import { Knex } from 'knex';
import { ITable } from './table.interface';

/**
 * Describe the database table, and the connection associated with it.
 */
export interface IDatabase {
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
   * Tables associated with the database
   */
  tables: ITable[];

  /**
   * List of regex patterns to filter tables from the database.
   * In case it's empty, all tables are returned.
   */
  filters: string[];
}
