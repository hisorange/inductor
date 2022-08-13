import knex, { Knex } from 'knex';
import { Model, ModelClass, Pojo } from 'objection';
import { Logger } from 'pino';
import { ColumnTools } from '../../component/column-tools';
import { FactCollector } from '../../component/fact.collector';
import { IBlueprint } from '../../interface/blueprint/blueprint.interface';
import { IDatabase } from '../../interface/database.interface';
import { IDriver } from '../../interface/driver.interface';
import { IFactCollector } from '../../interface/fact/fact-collector.interface';
import { IMigrator } from '../../interface/migrator.interface';
import { postgresValidateBlueprint } from './postgres.blueprint-validator';
import { PostgresFactSource } from './postgres.fact-source';
import { PostgresMigrator } from './postgres.migrator';

export class PostgresDriver implements IDriver {
  readonly migrator: IMigrator;
  readonly connection: Knex;
  readonly factCollector: IFactCollector;

  constructor(id: string, logger: Logger, readonly database: IDatabase) {
    this.connection = knex({
      client: 'pg',
      connection: {
        application_name: `inductor.${id}`,
        ...this.database.connection,
      },
      pool: {
        max: 50,
        min: 0,
        idleTimeoutMillis: 5_000,
      },
    });

    this.factCollector = new FactCollector(
      new PostgresFactSource(this.connection),
    );
    this.migrator = new PostgresMigrator(
      logger,
      this.connection,
      this.factCollector,
    );
  }

  validateBlueprint(blueprint: IBlueprint) {
    postgresValidateBlueprint(blueprint);
  }

  /**
   * Convert the blueprint into a model class.
   */
  toModel(blueprint: IBlueprint): ModelClass<Model> {
    this.validateBlueprint(blueprint);

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
}
