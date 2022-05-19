import knex, { Knex } from 'knex';
import { Model, ModelClass, Pojo } from 'objection';
import pino, { Logger } from 'pino';
import { ISchema } from './interface/schema.interface';
import { Migrator } from './migrator';
import { filterPrimary } from './util/primary.filter';

/**
 * This class manages the connection and applies the state of the database.
 */
export class Connection {
  /**
   * Pino instance
   */
  readonly logger: Logger;

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
  protected schemas = new Map<
    string,
    { schema: ISchema; model: ModelClass<Model> }
  >();

  /**
   * Store the current connection's database name.
   */
  protected dbName: string | undefined;

  /**
   * Create a new connection
   */
  constructor(
    protected config: {
      connection: Knex.PgConnectionConfig;
      logger?: Logger;
    },
  ) {
    this.logger =
      config.logger ||
      pino({
        name: `inductor.${this.config.connection.database}`,
        level: process.env.NODE_ENV !== 'production' ? 'debug' : 'warn',
      });

    this.logger.info('Creating connection');

    this.knex = knex({
      client: 'pg',
      connection: {
        application_name: 'Inductor',
        ...this.config.connection,
      },
    });

    this.migrator = new Migrator(this.logger, this.knex);

    this.logger.debug('Instance initialized');
  }

  /**
   * Get the database's name.
   */
  async getDatabaseName(): Promise<string> {
    // Check if the database name is already set
    if (!this.dbName) {
      this.dbName = (
        await this.knex
          .queryBuilder()
          .select<{ current_database: string }>(
            this.knex.raw('current_database()'),
          )
          .first()
      )?.current_database;
    }

    return this.dbName as string;
  }

  /**
   * Associate a schema with the connection
   */
  async setState(schemas: ISchema[]) {
    this.logger.info('Applying new state');

    this.schemas = new Map();

    for (const schema of schemas) {
      const model = this.toModel(schema);

      // Associate the knex instance with the newly created model class.
      model.knex(this.knex);

      this.schemas.set(schema.name, {
        schema,
        model,
      });
    }

    this.logger.info('Migrating database');
    await this.migrator.setState(schemas);

    this.logger.info('State applied');
  }

  /**
   * Get the associated model for the connection.
   */
  getModel(name: string): ModelClass<Model> | undefined {
    return this.schemas.get(name)?.model;
  }

  /**
   * Convert the schema into a model class.
   */
  protected toModel(schema: ISchema): ModelClass<Model> {
    // Map database columns to code level references
    // Database -> Model = Getter
    const toProperty = (s: ISchema) => {
      return (database: Pojo): Pojo => {
        return database;
      };
    };

    // Map code level references to database columns
    // Database -> Model = Setter
    const toColumn = (s: ISchema) => {
      return (code: Pojo): Pojo => {
        return code;
      };
    };

    // Hook before the model is created
    const onCreate = (schema: ISchema) => {
      return function () {};
    };

    // Hook before the model is updated
    const onUpdate = (s: ISchema) => {
      return function () {};
    };

    const model = class extends Model {};

    model.tableName = schema.name;
    model.idColumn = filterPrimary(schema);

    model.columnNameMappers = {
      parse: toProperty(schema),
      format: toColumn(schema),
    };

    model.prototype.$beforeInsert = onCreate(schema);
    model.prototype.$beforeUpdate = onUpdate(schema);

    return model;
  }

  close() {
    this.logger.info('Closing connection');

    return this.knex.destroy();
  }
}
