import knex, { Knex } from 'knex';
import { Model, ModelClass, Pojo } from 'objection';
import pino, { Logger } from 'pino';
import { ModelNotFound } from '../exception';
import { Migrator } from '../migration/migrator';
import { IMigrationPlan } from '../migration/types/migration-plan.interface';
import { IStepResult } from '../migration/types/step-result.interface';
import { Reflection } from '../reflection/reflection';
import { Reflector } from '../reflection/reflector';
import { IReflection } from '../reflection/types';
import { ITable, TableMap, ValidateTable } from '../table';
import { ColumnTools } from '../tools/column-tools';
import { IDatabase } from './types/database.interface';
import { IDriver } from './types/driver.interface';

export class Driver implements IDriver {
  /**
   * Associated tables with the connection
   */
  protected tableMap: TableMap = new Map();

  readonly id: string = Date.now().toString(36);
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

    this.updateTableMap(database.tables);
  }

  /**
   * Convert the table into a model class.
   */
  protected toModel(table: ITable): ModelClass<Model> {
    ValidateTable(table);

    // Prepare fast lookup maps for both propery and column name conversions.
    // Even tho this is a small amount of data, it's worth it to avoid
    // having to iterate over the properties of the model class.
    const columnMap = new Map<string, string>();
    const propertyMap = new Map<string, string>();

    for (const columnName in table.columns) {
      if (Object.prototype.hasOwnProperty.call(table.columns, columnName)) {
        const columnDefinition = table.columns[columnName];

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

    model.tableName = table.name;
    model.idColumn = ColumnTools.filterPrimary(table);

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

  compareState(tables: ITable[]): Promise<IMigrationPlan> {
    return this.migrator.compareDatabaseState(tables);
  }

  async setState(tables: ITable[]): Promise<IStepResult[]> {
    return this.compareState(tables)
      .then(plan => plan.execute())
      .then(result => {
        this.updateTableMap(tables);

        return result;
      });
  }

  protected updateTableMap(tables: ITable[]) {
    tables.forEach(b => {
      for (const columnName in b.columns) {
        b.columns[columnName].capabilities.sort((a, b) => a - b);
      }
    });

    this.tableMap = new Map(
      tables.map(table => [
        table.name,
        {
          table,
          model: this.toModel(table),
        },
      ]),
    );
  }

  async readState(filters: string[] = []): Promise<ITable[]> {
    return this.migrator.readDatabaseState(filters).then(state => {
      this.updateTableMap(state);
      return state;
    });
  }

  getModel<T extends Model = Model>(table: string): ModelClass<T> {
    if (!this.tableMap.has(table)) {
      throw new ModelNotFound(table);
    }

    return this.tableMap.get(table)!.model as ModelClass<T>;
  }

  closeConnection() {
    return this.knex.destroy();
  }

  getTableDescriptors(): ITable[] {
    return Array.from(this.tableMap.values()).map(({ table: table }) => table);
  }

  getModels(): ModelClass<Model>[] {
    return Array.from(this.tableMap.values()).map(({ model }) => model);
  }
}
