import { Knex } from 'knex';
import { Inspector } from './inspector';
import { ISchema } from './interface/schema.interface';
import { createTable } from './migrator/create-table';

// Calculates and applies the changes on the database
export class Migrator {
  /**
   * The connection to inspect
   */
  readonly inspector: Inspector;

  constructor(protected knex: Knex) {
    this.inspector = new Inspector(knex);
  }

  /**
   * Reads the connection's database into a set of structure, and update it to match the schemas
   */
  async apply(schemas: ISchema[]) {
    const tables = await this.inspector.tables();
    const queries: Knex.SchemaBuilder[] = [];

    schemas.forEach(schema => {
      if (schema.kind === 'table') {
        if (!tables.includes(schema.name)) {
          queries.push(createTable(this.knex.schema, schema));
        }
      }
    });

    await Promise.all(queries);
  }
}
