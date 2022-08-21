import EventEmitter2 from 'eventemitter2';
import knex, { Knex } from 'knex';
import { Model, ModelClass, Pojo } from 'objection';
import pino, { Logger } from 'pino';
import { v4 } from 'uuid';
import { BlueprintMap, IBlueprint, validateBlueprint } from '../blueprint';
import { ModelNotFound } from '../exception';
import { FactManager } from '../fact/fact.manager';
import { FactReader } from '../fact/fact.reader';
import { IFactManager } from '../fact/types';
import { MigrationManager } from '../migration/migration.manager';
import { IMigrationManager } from '../migration/types/migration-manager.interface';
import { IMigrationPlan } from '../migration/types/migration-plan.interface';
import { IStepResult } from '../migration/types/step-result.interface';
import { ColumnTools } from '../tools/column-tools';
import { IDatabase } from './types/database.interface';
import { IDriver } from './types/driver.interface';

export class Driver implements IDriver {
  /**
   * Associated blueprints with the connection
   */
  protected blueprints: BlueprintMap = new Map();

  readonly migrationManager: IMigrationManager;
  readonly factManager: IFactManager;
  protected connection: Knex;
  protected logger: Logger;
  readonly event: EventEmitter2;

  constructor(readonly database: IDatabase) {
    const id = v4().substring(0, 8);
    this.logger = pino({
      name: `inductor.${id}`,
      level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
      enabled: process.env.NODE_ENV !== 'test',
    });
    this.event = new EventEmitter2();

    this.connection = knex({
      client: 'pg',
      connection: {
        application_name: `inductor.${id}`,
        ...this.database.connection,
      } as Knex.PgConnectionConfig,
      pool: {
        max: 50,
        min: 0,
        idleTimeoutMillis: 5_000,
      },
    });

    this.connection.on('query', query => {
      this.event.emit('query', query);
    });

    this.factManager = new FactManager(new FactReader(this.connection));
    this.migrationManager = new MigrationManager(
      this.logger,
      this.connection,
      this.factManager,
    );
  }

  /**
   * Convert the blueprint into a model class.
   */
  protected toModel(blueprint: IBlueprint): ModelClass<Model> {
    validateBlueprint(blueprint);

    // Prepare fast lookup maps for both propery and column name conversions.
    // Even tho this is a small amount of data, it's worth it to avoid
    // having to iterate over the properties of the model class.
    const columnMap = new Map<string, string>();
    const propertyMap = new Map<string, string>();

    for (const columnName in blueprint.columns) {
      if (Object.prototype.hasOwnProperty.call(blueprint.columns, columnName)) {
        const columnDefinition = blueprint.columns[columnName];

        const propertyName = columnDefinition?.propertyName ?? columnName;

        // Map column names to property names
        columnMap.set(columnName, propertyName);
        // Map property names to column names
        propertyMap.set(propertyName, columnName);
      }
    }

    // Map database columns to code level references
    // Database -> Model = Getter
    const databaseToModel = (dbPojo: Pojo): Pojo => {
      const modelPojo: Pojo = {};

      for (const columnName of Object.keys(dbPojo)) {
        modelPojo[columnMap.get(columnName)!] = dbPojo[columnName];
      }

      return dbPojo;
    };

    // Map code level references to database columns
    // Database -> Model = Setter
    const modelToDatabase = (modelPojo: Pojo): Pojo => {
      const dbPojo: Pojo = {};

      for (const propertyName of Object.keys(modelPojo)) {
        dbPojo[propertyMap.get(propertyName)!] = modelPojo[propertyName];
      }

      return dbPojo;
    };

    // Hook before the model is created
    const onCreate = () => {};

    // Hook before the model is updated
    const onUpdate = () => {};

    const model = class extends Model {};

    model.tableName = blueprint.tableName;
    model.idColumn = ColumnTools.filterPrimary(blueprint);

    model.columnNameMappers = {
      parse: databaseToModel,
      format: modelToDatabase,
    };

    // model.prototype.$beforeInsert = onCreate;
    // model.prototype.$beforeUpdate = onUpdate;

    // Associate the knex instance with the newly created model class.
    model.knex(this.connection);

    return model;
  }

  compareState(blueprints: IBlueprint[]): Promise<IMigrationPlan> {
    return this.migrationManager.compareDatabaseState(blueprints);
  }

  async setState(blueprints: IBlueprint[]): Promise<IStepResult[]> {
    return this.compareState(blueprints)
      .then(plan => plan.execute())
      .then(result => {
        this.blueprints = new Map(
          blueprints.map(blueprint => [
            blueprint.tableName,
            {
              blueprint,
              model: this.toModel(blueprint),
            },
          ]),
        );

        return result;
      });
  }

  readState(filters: string[] = []): Promise<IBlueprint[]> {
    return this.migrationManager.readDatabaseState(filters);
  }

  getModel<T extends Model = Model>(table: string): ModelClass<T> {
    if (!this.blueprints.has(table)) {
      throw new ModelNotFound(table);
    }

    return this.blueprints.get(table)!.model as ModelClass<T>;
  }

  closeConnection() {
    return this.connection.destroy();
  }
}