import { Knex } from 'knex';
import { ISchema } from '../../schema';

/**
 * Describe the database schema, and the connection associated with it.
 */
export interface IDatabase<
  DatabaseMeta = unknown,
  SchemaMeta = unknown,
  ColumnMeta = unknown,
> {
  /**
   * Database connection configuration
   */
  readonly connection: Knex.PgConnectionConfig;

  /**
   * Flag to indicate that the schemas are read only,
   * and the database should not be modified.
   */
  readonly isReadOnly: boolean;

  /**
   * schemas associated with the database
   */
  schemas: ISchema<SchemaMeta, ColumnMeta>[];

  /**
   * List of regex patterns to filter schemas from the database.
   * In case it's empty, all schemas are returned.
   */
  filters: string[];

  /**
   * Associated metadata with the database
   */
  meta?: DatabaseMeta;
}
