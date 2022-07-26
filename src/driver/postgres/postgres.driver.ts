import knex, { Knex } from 'knex';
import { Model, ModelClass, Pojo } from 'objection';
import { Logger } from 'pino';
import { ColumnTools } from '../../column-tools';
import { IDatabase } from '../../interface/database.interface';
import { IDriver } from '../../interface/driver.interface';
import { ISchema } from '../../interface/schema.interface';
import { PostgresInspector } from './postgres.inspector';
import { PostgresMigrator } from './postgres.migrator';
import { postgresValidateSchema } from './postgres.schema-validator';

export class PostgresDriver implements IDriver {
  readonly migrator: PostgresMigrator;
  readonly inspector: PostgresInspector;
  readonly connection: Knex;

  constructor(logger: Logger, readonly database: IDatabase) {
    (this.connection = knex({
      client: 'pg',
      connection: {
        application_name: 'Inductor',
        ...this.database.connection,
      },
      pool: {
        max: 50,
        min: 0,
        idleTimeoutMillis: 5_000,
      },
    })),
      (this.inspector = new PostgresInspector(this.connection));
    this.migrator = new PostgresMigrator(
      logger,
      this.inspector,
      this.connection,
    );
  }

  validateSchema(schema: ISchema) {
    postgresValidateSchema(schema);
  }

  /**
   * Convert the schema into a model class.
   */
  toModel(schema: ISchema): ModelClass<Model> {
    this.validateSchema(schema);

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
    model.idColumn = ColumnTools.filterPrimary(schema);

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
}
