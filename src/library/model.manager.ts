import { Model, ModelClass, Pojo } from 'objection';
import { ModelNotFound } from '../exception/model-not-found.exception';
import { ITable } from '../types/table.interface';
import { TableMap } from '../types/table.map';
import { ColumnTools } from '../utils/column-tools';
import type { Migrator } from './migrator';
import { ValidateTable } from './table.validator';

export class ModelManager {
  protected tables: TableMap = new Map();

  constructor(protected readonly migrator: Migrator) {}

  public asJson(tableName: string): string {
    return JSON.stringify(this.getTable(tableName), null, 2);
  }

  public fromJson(json: string): void {
    this.addTable(JSON.parse(json) as ITable);
  }

  public getTableMap(): TableMap {
    return this.tables;
  }

  public setTables(tables: ITable[]): void {
    this.tables.clear();

    tables.forEach(table => this.addTable(table));
  }

  public validateRelations(): void {
    for (const { table } of this.tables.values()) {
      if (table.relations) {
        for (const relationName in table.relations) {
          if (
            Object.prototype.hasOwnProperty.call(table.relations, relationName)
          ) {
            const relationDefinition = table.relations[relationName];

            if (relationDefinition.references.table) {
              if (
                !this.migrator.reflection.isTableExists(
                  relationDefinition.references.table,
                )
              ) {
                throw new Error(
                  `Table ${relationDefinition.references.table} not found`,
                );
              }
            }
          }
        }
      }
    }
  }

  public addTable(table: ITable): void {
    ValidateTable(table);

    for (const columnName in table.columns) {
      table.columns[columnName].capabilities.sort((a, b) => a - b);
    }

    const model = this.toModel(table);
    this.tables.set(table.name, { table, model });
  }

  public removeTable(tableName: string): void {
    this.tables.delete(tableName);
  }

  public getTable(tableName: string): ITable {
    const table = this.tables.get(tableName);

    if (!table) {
      throw new Error(`Table ${tableName} not found`);
    }

    return table.table;
  }

  public getModel<T extends Model = Model>(tableName: string): ModelClass<T> {
    const table = this.tables.get(tableName);

    if (!table) {
      throw new ModelNotFound(tableName);
    }

    return table.model as ModelClass<T>;
  }

  /**
   * Convert the table into a model class.
   */
  protected toModel(table: ITable): ModelClass<Model> {
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
}
