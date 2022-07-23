import knex, { Knex } from 'knex';
import { Model, ModelClass } from 'objection';
import pino, { Logger } from 'pino';
import { PostgresDriver } from './driver/postgres/postgres.driver';
import { IDriver } from './interface/driver.interface';
import { IInductor } from './interface/inductor.interface';
import { ISchema } from './interface/schema.interface';

export class Inductor implements IInductor {
  /**
   * Pino instance
   */
  readonly logger: Logger;

  /**
   * Associated schemas with the connection
   */
  protected currentState = new Map<
    string,
    { schema: ISchema; model: ModelClass<Model> }
  >();

  readonly driver: IDriver;

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
      config.logger || this.createLogger(this.config.connection.database!);

    this.logger.info('Creating connection');

    this.driver = new PostgresDriver(
      this.logger,
      knex({
        client: 'pg',
        connection: {
          application_name: 'Inductor',
          ...this.config.connection,
        },
        pool: {
          max: 50,
          min: 0,
          idleTimeoutMillis: 5_000,
        },
      }),
    );

    this.logger.debug('Instance initialized');
  }

  /**
   * Create a logger instance.
   */
  protected createLogger(name: string): Logger {
    return pino({
      name: `inductor.${name}`,
      level: process.env.NODE_ENV !== 'production' ? 'debug' : 'warn',
      enabled: process.env.NODE_ENV !== 'test',
    });
  }

  async cmpState(schemas: ISchema[]): Promise<string[]> {
    return await this.driver.migrator
      .cmpState(schemas)
      .then(changes => changes.map(change => change.toQuery()));
  }

  async setState(schemas: ISchema[]) {
    this.logger.info('Applying new state');

    const newSchemaMap = new Map();

    for (const schema of schemas) {
      const model = this.driver.toModel(schema);

      // Associate the knex instance with the newly created model class.
      model.knex(this.driver.connection);

      newSchemaMap.set(schema.tableName, {
        schema,
        model,
      });
    }

    this.currentState = newSchemaMap;

    this.logger.info('Migrating database');
    await this.driver.migrator.setState(schemas);

    this.logger.info('State applied');
  }

  getModel<T extends Model = Model>(name: string): ModelClass<T> {
    const association = this.currentState.get(name);

    if (!association) {
      throw new Error(`Model ${name} not found`);
    }

    return association.model as ModelClass<T>;
  }

  async readState(): Promise<ISchema[]> {
    return this.driver.migrator.readState();
  }

  close() {
    this.logger.info('Closing connection');

    return this.driver.connection.destroy();
  }
}
