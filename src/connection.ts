import knex, { Knex } from 'knex';
import { ISchema } from './interface/schema.interface';
import { Migrator } from './migrator';

/**
 * This class manages the connection and applies the state of the database.
 */
export class Connection {
  /**
   * Store the Knex instance
   */
  readonly knex: Knex;

  /**
   * Store the migrator instance
   */
  readonly migrator: Migrator;

  /**
   * Associated schemas with the connection
   */
  protected schemas: ISchema[] = [];

  /**
   * Create a new connection
   */
  constructor(
    protected config: {
      connection: Knex.PgConnectionConfig;
    },
  ) {
    this.knex = knex({
      client: 'pg',
      connection: this.config.connection,
    });

    this.migrator = new Migrator(this.knex);
  }

  /**
   * Associate a schema with the connection
   */
  async associate(schema: ISchema) {
    // Check if the schemas is already associated
    if (this.schemas.find(b => b.name === schema.name)) {
      throw new Error(`Schema ${schema.name} is already associated`);
    }

    this.schemas.push(schema);
    await this.migrator.apply(this.schemas);
  }

  close() {
    return this.knex.destroy();
  }
}
