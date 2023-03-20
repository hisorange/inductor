import { Knex } from 'knex';
import { ITable } from '../../table';

/**
 * Describe the database table, and the connection associated with it.
 */
export interface IDatabase<
  DatabaseMeta = unknown,
  TableMeta = unknown,
  ColumnMeta = unknown,
> {
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
  tables: ITable<TableMeta, ColumnMeta>[];

  /**
   * List of regex patterns to filter tables from the database.
   * In case it's empty, all tables are returned.
   */
  filters: string[];

  /**
   * Associated metadata with the database
   */
  meta?: DatabaseMeta;
}
