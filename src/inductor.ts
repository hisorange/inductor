import { Model, ModelClass } from 'objection';
import pino, { Logger } from 'pino';
import { PostgresDriver } from './driver/postgres/postgres.driver';
import { IChangePlan } from './interface/change-plan.interface';
import { IDatabase } from './interface/database.interface';
import { IDriver } from './interface/driver.interface';
import { IInductor } from './interface/inductor.interface';
import { ISchema } from './interface/schema/schema.interface';

export class Inductor implements IInductor {
  /**
   * Associated schemas with the connection
   */
  protected currentState = new Map<
    string,
    { schema: ISchema; model: ModelClass<Model> }
  >();

  readonly driver: IDriver;
  readonly logger: Logger;

  /**
   * Create a new connection
   */
  constructor(database: IDatabase, logger?: Inductor['logger']) {
    this.logger = logger || this.createLogger(database.id);

    this.logger.debug('Creating driver');
    this.driver = new PostgresDriver(this.logger, database);
    this.logger.debug('Driver is ready');
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

  async cmpState(schemas: ISchema[]): Promise<IChangePlan> {
    return await this.driver.migrator.cmpState(schemas);
  }

  async setState(schemas: ISchema[]) {
    this.logger.info('Applying new state');

    const newSchemaMap: Inductor['currentState'] = new Map();

    for (const schema of schemas) {
      newSchemaMap.set(schema.tableName, {
        schema,
        model: this.driver.toModel(schema),
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
