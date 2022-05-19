import { Knex } from 'knex';
import { Logger } from 'pino';
import { Inspector } from './inspector';
import { ISchema } from './interface/schema.interface';
import { alterTable } from './migrator/alter.table';
import { createTable } from './migrator/create.table';
import { reverseTable } from './migrator/reverse.table';
import { sanitizeSchema } from './util/sanitize.schema';

// Calculates and applies the changes on the database
export class Migrator {
  /**
   * The connection to inspect
   */
  readonly inspector: Inspector;

  /**
   * Initialize the migrator
   */
  constructor(readonly logger: Logger, protected knex: Knex) {
    this.inspector = new Inspector(knex);
  }

  /**
   * Reads the connection's database into a set of structure, and update it to match the schemas
   */
  async setState(schemas: ISchema[]) {
    const tables = await this.inspector.tables();
    const queries: Knex.SchemaBuilder[] = [];

    for (let schema of schemas) {
      this.logger.debug('Processing schema %s', schema.name);

      // Fix inconsistent schemas
      schema = sanitizeSchema(schema);

      if (schema.kind === 'table') {
        // If the table doesn't exist, create it
        if (!tables.includes(schema.name)) {
          queries.push(createTable(this.knex.schema, schema));
        }
        // If the table exists, compare the state and apply the alterations
        else {
          const currentSchema = await reverseTable(this.inspector, schema.name);

          queries.push(alterTable(this.knex.schema, currentSchema, schema));
        }
      }
    }

    for (const query of queries) {
      const sql = query.toQuery();

      if (sql.length) {
        this.logger.debug(sql);
      }

      await query;
    }
  }
}
