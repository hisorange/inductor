import knex, { Knex } from 'knex';
import { nanoid } from 'nanoid';
import { Model, ModelClass, Pojo } from 'objection';
import pino, { Logger } from 'pino';
import { ModelNotFound } from '../exception';
import { Migrator } from '../migration/migrator';
import { IMigrationPlan } from '../migration/types/migration-plan.interface';
import { IStepResult } from '../migration/types/step-result.interface';
import { Reflection } from '../reflection/reflection';
import { Reflector } from '../reflection/reflector';
import { IReflection } from '../reflection/types';
import { ISchema, SchemaMap, ValidateSchema } from '../schema';
import { ColumnTools } from '../tools/column-tools';
import { IDatabase } from './types/database.interface';
import { IDriver } from './types/driver.interface';

export class Driver implements IDriver {
  /**
   * Associated schemas with the connection
   */
  protected schemas: SchemaMap = new Map();

  readonly id: string = nanoid(8);
  readonly migrator: Migrator;
  readonly reflection: IReflection;
  readonly knex: Knex;
  protected logger: Logger;

  constructor(readonly database: IDatabase) {
    this.logger = pino({
      name: `inductor.${this.id}`,
      level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
      enabled: process.env.NODE_ENV !== 'test',
    });

    this.knex = knex({
      client: 'pg',
      connection: {
        application_name: `inductor.${this.id}`,
        ...this.database.connection,
      } as Knex.PgConnectionConfig,
      pool: {
        max: 50,
        min: 0,
        idleTimeoutMillis: 5_000,
      },
    });

    this.reflection = new Reflection(new Reflector(this.knex));
    this.migrator = new Migrator(this.logger, this.knex, this.reflection);

    this.updateBluprintMap(database.blueprints);
  }

  /**
   * Convert the blueprint into a model class.
   */
  protected toModel(blueprint: ISchema): ModelClass<Model> {
    ValidateSchema(blueprint);

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
    model.knex(this.knex);

    return model;
  }

  compareState(blueprints: ISchema[]): Promise<IMigrationPlan> {
    return this.migrator.compareDatabaseState(blueprints);
  }

  async setState(blueprints: ISchema[]): Promise<IStepResult[]> {
    return this.compareState(blueprints)
      .then(plan => plan.execute())
      .then(result => {
        this.updateBluprintMap(blueprints);

        return result;
      });
  }

  protected updateBluprintMap(schemas: ISchema[]) {
    schemas.forEach(b => {
      for (const columnName in b.columns) {
        b.columns[columnName].capabilities.sort((a, b) => a - b);
      }
    });

    this.schemas = new Map(
      schemas.map(schema => [
        schema.tableName,
        {
          schema,
          model: this.toModel(schema),
        },
      ]),
    );
  }

  async readState(filters: string[] = []): Promise<ISchema[]> {
    const currentState = await this.migrator.readDatabaseState(filters);

    this.updateBluprintMap(currentState);

    return currentState;
  }

  getModel<T extends Model = Model>(table: string): ModelClass<T> {
    if (!this.schemas.has(table)) {
      throw new ModelNotFound(table);
    }

    return this.schemas.get(table)!.model as ModelClass<T>;
  }

  closeConnection() {
    return this.knex.destroy();
  }

  getBlueprints(): ISchema[] {
    return Array.from(this.schemas.values()).map(
      ({ schema: blueprint }) => blueprint,
    );
  }

  getModels(): ModelClass<Model>[] {
    return Array.from(this.schemas.values()).map(({ model }) => model);
  }
}
