import { Model, ModelClass, Pojo } from 'objection';
import { ModelNotFound } from './exception/model-not-found.exception';
import { Migrator } from './library/migrator';
import { Plan } from './library/plan';
import { ValidateTable } from './library/table.validator';
import { IDatabase } from './types/database.interface';
import { IStepResult } from './types/step-result.interface';
import { ITable } from './types/table.interface';
import { TableMap } from './types/table.map';
import { ColumnTools } from './utils/column-tools';

export class Inductor {
  /**
   * Map table descriptions with their model classes.
   */
  protected tableMap: TableMap = new Map();

  /**
   * Session ID for this instance, allows to track the logs, and queries.
   */
  readonly id: string = Date.now().toString(36);

  /**
   * Migrator is responsible for applying the changes to the database.
   */
  readonly migrator: Migrator;

  constructor(readonly database: IDatabase) {
    this.migrator = new Migrator(this.id, database);

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
        // TODO map from meta defintion

        // Map column names to property names
        columnMap.set(columnName, columnName);
        // Map property names to column names
        propertyMap.set(columnName, columnName);
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
    model.knex(this.migrator.knex);

    return model;
  }

  compareState(tables: ITable[]): Promise<Plan> {
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
    return this.migrator.knex.destroy();
  }

  getTableDescriptors(): ITable[] {
    return Array.from(this.tableMap.values()).map(({ table: table }) => table);
  }

  getModels(): ModelClass<Model>[] {
    return Array.from(this.tableMap.values()).map(({ model }) => model);
  }
}
