import { Model, ModelClass } from 'objection';
import pino, { Logger } from 'pino';
import { PostgresDriver } from './driver/postgres/postgres.driver';
import { IBlueprint } from './interface/blueprint/blueprint.interface';
import { IDatabase } from './interface/database.interface';
import { IDriver } from './interface/driver.interface';
import { IInductor } from './interface/inductor.interface';
import { IMigrationPlan } from './interface/migration/migration-plan.interface';

export class Inductor implements IInductor {
  /**
   * Associated blueprints with the connection
   */
  protected currentState = new Map<
    string,
    { blueprint: IBlueprint; model: ModelClass<Model> }
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
      level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
      enabled: process.env.NODE_ENV !== 'test',
    });
  }

  cmpState(blueprints: IBlueprint[]): Promise<IMigrationPlan> {
    return this.driver.migrator.cmpState(blueprints);
  }

  async setState(blueprints: IBlueprint[]): Promise<void> {
    this.logger.info('Applying new state');

    const plan = await this.driver.migrator.cmpState(blueprints);
    this.currentState = new Map();

    await plan.apply().then(() => {
      for (const blueprint of blueprints) {
        this.currentState.set(blueprint.tableName, {
          blueprint: blueprint,
          model: this.driver.toModel(blueprint),
        });
      }
    });
  }

  getModel<T extends Model = Model>(name: string): ModelClass<T> {
    const association = this.currentState.get(name);

    if (!association) {
      throw new Error(`Model ${name} not found`);
    }

    return association.model as ModelClass<T>;
  }

  async readState(filters: string[] = []): Promise<IBlueprint[]> {
    return this.driver.migrator.readState(filters);
  }

  close() {
    this.logger.info('Closing connection');

    return this.driver.connection.destroy();
  }
}
