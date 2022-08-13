import { Model, ModelClass } from 'objection';
import pino, { Logger } from 'pino';
import { v4 } from 'uuid';
import { PostgresDriver } from './driver/postgres/postgres.driver';
import { ModelNotFound } from './exception/model-not-found.exception';
import { IBlueprint } from './interface/blueprint/blueprint.interface';
import { IDatabase } from './interface/database.interface';
import { IDriver } from './interface/driver.interface';
import { IInductor } from './interface/inductor.interface';
import { IMigrationPlan } from './interface/migration/migration-plan.interface';
import { IStepResult } from './interface/migration/step-result.interface';

export class Inductor implements IInductor {
  /**
   * Associated blueprints with the connection
   */
  protected blueprints = new Map<
    string,
    { blueprint: IBlueprint; model: ModelClass<Model> }
  >();

  readonly id: string;
  readonly logger: Logger;
  readonly driver: IDriver;

  /**
   * Create a new connection
   */
  constructor(database: IDatabase, logger?: Inductor['logger']) {
    this.id = v4().substring(0, 8);
    this.logger = logger || this.createLogger();
    this.driver = new PostgresDriver(this.id, this.logger, database);
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
    return this.driver.migrator
      .compare(blueprints)
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

  model<T extends Model = Model>(table: string): ModelClass<T> {
    if (!this.blueprints.has(table)) {
      throw new ModelNotFound(table);
    }

    return this.blueprints.get(table)!.model as ModelClass<T>;
  }

  reverse(filters: string[] = []): Promise<IBlueprint[]> {
    return this.driver.migrator.reverse(filters);
  }

  close() {
    this.logger.info('Closing connection');
    return this.driver.connection.destroy();
  }
}
