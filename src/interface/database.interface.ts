import { Knex } from 'knex';
import { ISchema } from './schema/schema.interface';

/**
 * Describe the database schema, and the connection associated with it.
 */
export interface IDatabase<
  DatabaseMeta = unknown,
  SchemaMeta = unknown,
  ColumnMeta = unknown,
> {
  /**
   * Identifier for logging purposes
   */
  readonly id: string;

  /**
   * Indicates which driver is used to connect to the database,
   * and which model is used to interact with the schemas.
   */
  readonly provider: 'postgres';

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
   * Schemas associated with the database
   */
  schemas: {
    [schemaRef: string]: ISchema<SchemaMeta, ColumnMeta>;
  };

  /**
   * List of regex patterns to filter schemas from the database.
   * In case it's empty, all schemas are returned.
   */
  schemaFilters: string[];

  /**
   * Associated metadata with the database
   */
  meta?: DatabaseMeta;
}
