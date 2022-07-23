import knex, { Knex } from 'knex';
import { Model, ModelClass, Pojo } from 'objection';
import pino, { Logger } from 'pino';
import { PostgresDriver } from './driver/postgres/postgres.driver';
import { postgresValidateSchema } from './driver/postgres/postgres.schema-validator';
import { IDriver } from './interface/driver.interface';
import { IInductor } from './interface/inductor.interface';
import { ISchema } from './interface/schema.interface';
import { filterPrimary } from './util/primary.filter';

export class Inductor implements IInductor {
  /**
   * Pino instance
   */
  readonly logger: Logger;

  /**
   * Store the Knex instance
   */
  readonly knex: Knex;

  /**
   * Associated schemas with the connection
   */
  protected schemaDictionary = new Map<
    string,
    { schema: ISchema; model: ModelClass<Model> }
  >();

  /**
   * Store the current connection's database name.
   */
  protected dbName: string | undefined;

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
      config.logger ||
      pino({
        name: `inductor.${this.config.connection.database}`,
        level: process.env.NODE_ENV !== 'production' ? 'debug' : 'warn',
        enabled: process.env.NODE_ENV !== 'test',
      });

    this.logger.info('Creating connection');

    this.knex = knex({
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
    });

    this.driver = new PostgresDriver(this.logger, this.knex);

    this.logger.debug('Instance initialized');
  }

  /**
   * Get the database's name.
   */
  async getDatabaseName(): Promise<string> {
    // Check if the database name is already read
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

  async cmpState(schemas: ISchema[]): Promise<string[]> {
    return await this.driver.migrator
      .cmpState(schemas)
      .then(changes => changes.map(change => change.toQuery()));
  }

  async setState(schemas: ISchema[]) {
    this.logger.info('Applying new state');

    const newSchemaMap = new Map();

    for (const schema of schemas) {
      // Validate the schema
      postgresValidateSchema(schema);

      const model = this.toModel(schema);

      // Associate the knex instance with the newly created model class.
      model.knex(this.knex);

      newSchemaMap.set(schema.tableName, {
        schema,
        model,
      });
    }

    this.schemaDictionary = newSchemaMap;

    this.logger.info('Migrating database');
    await this.driver.migrator.setState(schemas);

    this.logger.info('State applied');
  }

  getModel<T extends Model = Model>(name: string): ModelClass<T> {
    const association = this.schemaDictionary.get(name);

    if (!association) {
      throw new Error(`Model ${name} not found`);
    }

    return association.model as ModelClass<T>;
  }

  /**
   * Convert the schema into a model class.
   */
  protected toModel(schema: ISchema): ModelClass<Model> {
    // Prepare fast lookup maps for both propery and column name conversions.
    // Even tho this is a small amount of data, it's worth it to avoid
    // having to iterate over the properties of the model class.
    const columnMap = new Map<string, string>();
    const propertyMap = new Map<string, string>();

    for (const columnName in Object.keys(schema.columns)) {
      const propertyName =
        schema.columns[columnName]?.propertyName ?? columnName;

      // Map column names to property names
      columnMap.set(columnName, propertyName);
      // Map property names to column names
      propertyMap.set(propertyName, columnName);
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

    model.tableName = schema.tableName;
    model.idColumn = filterPrimary(schema);

    model.columnNameMappers = {
      parse: databaseToModel,
      format: modelToDatabase,
    };

    // model.prototype.$beforeInsert = onCreate;
    // model.prototype.$beforeUpdate = onUpdate;

    return model;
  }

  async readState(): Promise<ISchema[]> {
    return this.driver.migrator.readState();
  }

  close() {
    this.logger.info('Closing connection');

    return this.knex.destroy();
  }
}
