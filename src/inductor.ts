import { Model, ModelClass } from 'objection';
import pino, { Logger } from 'pino';
import { v4 } from 'uuid';
import { PostgresDriver } from './driver/postgres/postgres.driver';
import { ModelNotFound, UnsupportedProvider } from './exception';
import {
  IBlueprint,
  IDatabase,
  IDriver,
  IInductor,
  IMigrationPlan,
  IStepResult,
} from './interface';
import { BlueprintMap } from './interface/blueprint.map';
import { DatabaseProvider } from './interface/database/database.provider';

export class Inductor implements IInductor {
  /**
   * Associated blueprints with the connection
   */
  protected blueprints: BlueprintMap = new Map();

  readonly id: string;
  readonly logger: Logger;
  readonly driver: IDriver;

  /**
   * Create a new connection
   */
  constructor(database: IDatabase, logger?: Inductor['logger']) {
    this.id = v4().substring(0, 8);
    this.logger = logger || this.createLogger();
    this.driver = this.createDriver(database);
  }

  /**
   * Create the driver instance based on the provider.
   */
  protected createDriver(database: IDatabase): IDriver {
    switch (database.provider) {
      case DatabaseProvider.POSTGRES:
        return new PostgresDriver(this.id, this.logger, database);
      default:
        throw new UnsupportedProvider(database.provider);
    }
  }

  /**
   * Create a logger instance.
   */
  protected createLogger(): Logger {
    return pino({
      name: `inductor.${this.id}`,
      level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
      enabled: process.env.NODE_ENV !== 'test',
    });
  }

  compare(blueprints: IBlueprint[]): Promise<IMigrationPlan> {
    return this.driver.migrator.compare(blueprints);
  }

  async migrate(blueprints: IBlueprint[]): Promise<IStepResult[]> {
    return this.compare(blueprints)
      .then(plan => plan.execute())
      .then(result => {
        this.blueprints = new Map(
          blueprints.map(blueprint => [
            blueprint.tableName,
            {
              blueprint,
              model: this.driver.toModel(blueprint),
            },
          ]),
        );

        return result;
      });
  }

  reverse(filters: string[] = []): Promise<IBlueprint[]> {
    return this.driver.migrator.reverse(filters);
  }

  model<T extends Model = Model>(table: string): ModelClass<T> {
    if (!this.blueprints.has(table)) {
      throw new ModelNotFound(table);
    }

    return this.blueprints.get(table)!.model as ModelClass<T>;
  }

  close() {
    this.logger.info('Closing connection');
    return this.driver.connection.destroy();
  }
}
