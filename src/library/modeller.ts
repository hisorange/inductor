import { pluralize, singularize } from 'inflection';
import {
  Model,
  ModelClass,
  ModelOptions,
  Pojo,
  QueryContext,
  RelationMappings,
} from 'objection';
import { ModelNotFound } from '../exception/model-not-found.exception';
import { ColumnCapability } from '../types/column.capability';
import { ITable } from '../types/table.interface';
import { TableMap } from '../types/table.map';
import { ColumnTools } from '../utils/column-tools';
import type { Migrator } from './migrator';
import { ValidateTable } from './table.validator';

export class Modeller {
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

  public addTable(table: ITable): void {
    ValidateTable(table);

    for (const columnName in table.columns) {
      table.columns[columnName].capabilities?.sort((a, b) => a - b);
    }

    const model = this.toModel(table);
    this.tables.set(table.name, { table, model });

    this.remapRelations();
  }

  protected remapRelations(): void {
    // Map relations to models
    for (const { table, model } of this.tables.values()) {
      const success = this.mapRelations(model, table);

      if (!success) {
        console.warn(`Failed to map relations for table ${table.name}`);
      }
    }
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
    const model = class extends Model {} as ModelClass<Model>;

    model.tableName = table.name;

    // Prepare fast lookup maps for both propery and column name conversions.
    // Even tho this is a small amount of data, it's worth it to avoid
    // having to iterate over the properties of the model class.
    const columnToProperty = new Map<string, string>();
    const propertyToColumn = new Map<string, string>();

    for (const columnName in table.columns) {
      if (Object.prototype.hasOwnProperty.call(table.columns, columnName)) {
        const column = table.columns[columnName];

        // Map column names to property names
        columnToProperty.set(columnName, column.alias || columnName);
        // Map property names to column names
        propertyToColumn.set(column.alias || columnName, columnName);
      }
    }

    model.idColumn = ColumnTools.filterPrimary(table);

    // TODO: getter and setter hooks

    // Map database columns to code level references
    // Database -> Model = Getter
    const databaseToModel = function (dbPojo: Pojo): Pojo {
      Object.keys(dbPojo).forEach(column => {
        const property = columnToProperty.get(column)!;

        if (property !== column) {
          dbPojo[columnToProperty.get(column)!] = dbPojo[column];
          delete dbPojo[column];
        }
      });

      return dbPojo;
    };

    // Map code level references to database columns
    // Database -> Model = Setter
    const modelToDatabase = function (modelPojo: Pojo): Pojo {
      Object.keys(modelPojo).forEach(property => {
        const column = propertyToColumn.get(property)!;

        if (property !== column) {
          modelPojo[column] = modelPojo[property];
          delete modelPojo[property];
        }
      });

      return modelPojo;
    };

    // Quick lookup for the capabilities
    const createdAtProps = new Set<string>();
    const updatedAtProps = new Set<string>();
    const versionProps = new Set<string>();

    // Set of JSON or JSONB columns
    const jsonProps = new Set<string>();

    Object.keys(table.columns).forEach(columnName => {
      const column = table.columns[columnName];
      const property = columnToProperty.get(columnName)!;
      const capabilities = column.capabilities;

      if (capabilities && capabilities.length) {
        if (capabilities.includes(ColumnCapability.CREATED_AT)) {
          createdAtProps.add(property);
        } else if (capabilities.includes(ColumnCapability.UPDATED_AT)) {
          updatedAtProps.add(property);
        }
      }

      if (ColumnTools.isJsonType(column)) {
        jsonProps.add(property);
      }
    });

    // Hook before the model is created only if there is any capability that activates it
    if (createdAtProps.size || versionProps.size) {
      model.prototype.$beforeInsert = function () {
        const properties = Object.keys(this);

        if (createdAtProps.size) {
          const createdAt = new Date()
            .toISOString()
            .replace(/T|Z/g, ' ')
            .trim();

          createdAtProps.forEach(property => {
            if (!properties.includes(property) || !this[property]) {
              this[property] = createdAt;
            }
          });
        }

        if (versionProps.size) {
          versionProps.forEach(property => {
            this[property] = 1;
          });
        }
      };
    }

    // Hook before the model is updated only if there is any capability that activates it
    if (updatedAtProps.size || versionProps.size) {
      model.prototype.$beforeUpdate = function (
        opts: ModelOptions,
        queryContext: QueryContext,
      ) {
        const properties = Object.keys(this);

        console.log('Before update', properties);

        if (updatedAtProps.size) {
          const updatedAt = new Date().toISOString().replace(/T|Z/g, ' ');

          updatedAtProps.forEach(property => {
            this[property] = updatedAt;
          });
        }

        if (versionProps.size) {
          versionProps.forEach(property => {
            if (properties.includes(property)) {
              this[property] = this[property] + 1;
            }

            // queryContext.transaction.increment(property, 1);
            // console.log('Incrementing', property, this[property]);
          });
        }
      };
    }

    model.jsonAttributes = Array.from(jsonProps);

    model.columnNameMappers = {
      parse: databaseToModel,
      format: modelToDatabase,
    };

    // Associate the knex instance with the newly created model class.
    model.knex(this.migrator.connection);

    // TODO: map relations in context for the database

    return model;
  }

  protected mapRelations(model: ModelClass<Model>, table: ITable): boolean {
    const map: RelationMappings = {};
    let success = true;

    for (const name in table.relations) {
      const fk = table.relations[name];

      if (!this.tables.has(fk.references.table)) {
        success = false;

        continue;
      }

      const target = this.getModel(fk.references.table);
      const forwardName = fk.alias || name;

      map[forwardName] = {
        relation: Model.BelongsToOneRelation,
        modelClass: target,
        join: {
          from: fk.columns.map(column => `${table.name}.${column}`),
          to: fk.references.columns.map(column => `${target.name}.${column}`),
        },
      };

      // console.log('Mapped relation: ', forwardName, '->', map[name]);

      if (!target.relationMappings) {
        target.relationMappings = {};
      }

      if (typeof target.relationMappings == 'object') {
        const inverse: RelationMappings[string] = {
          relation: fk.isLocalUnique
            ? Model.HasOneRelation
            : Model.HasManyRelation,
          modelClass: model,
          join: {
            from: fk.references.columns.map(
              column => `${target.name}.${column}`,
            ),
            to: fk.columns.map(column => `${table.name}.${column}`),
          },
        };

        const inverseName = fk.isLocalUnique
          ? singularize(table.name)
          : pluralize(table.name);

        // Define the inverse relation
        target.relationMappings[inverseName] = inverse;

        // console.log('Mapped inverse relation', inverseName, inverse);
      }
    }

    model.relationMappings = map;

    return success;
  }
}
