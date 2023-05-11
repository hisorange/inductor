import { pluralize, singularize } from 'inflection';
import {
  Model,
  ModelClass,
  ModelOptions,
  Pojo,
  QueryContext,
  RelationMappings,
} from 'objection';
import { Logger } from 'pino';
import { ModelNotFound } from '../exception/model-not-found.exception';
import { HookDictionary } from '../hooks/hook.dictionary';
import { ColumnHook } from '../types/column-hook.enum';
import { ColumnCapability } from '../types/column.capability';
import { IDatabase } from '../types/database.interface';
import { ITable } from '../types/table.interface';
import { ColumnTools } from '../utils/column-tools';
import type { Migrator } from './migrator';
import { ValidateTable } from './table.validator';

export class ModelManager {
  protected modelCache: Map<string, ModelClass<Model>> = new Map();

  constructor(
    protected readonly migrator: Migrator,
    readonly database: IDatabase,
    readonly logger: Logger,
  ) {
    this.setTables(database.tables);
  }

  public asJson(tableName: string): string {
    return JSON.stringify(this.getTable(tableName), null, 2);
  }

  public fromJson(json: string): void {
    this.addTable(JSON.parse(json) as ITable);
  }

  public getTableMap(): Map<
    string,
    { table: ITable; model: ModelClass<Model> }
  > {
    return this.database.tables.reduce((map, table) => {
      map.set(table.name, { table, model: this.getModel(table.name) });
      return map;
    }, new Map());
  }

  public setTables(tables: ITable[]): void {
    this.database.tables = [];

    tables.forEach(table => this.addTable(table));
  }

  public addTable(table: ITable): void {
    ValidateTable(table);

    for (const columnName in table.columns) {
      table.columns[columnName].meta.capabilities?.sort(
        (a: number, b: number) => a - b,
      );
    }

    this.database.tables.push(table);

    const model = this.toModel(table);
    this.modelCache.set(table.name, model);

    this.remapRelations();
  }

  protected remapRelations(): void {
    // Map relations to models
    for (const table of this.database.tables) {
      const model = this.getModel(table.name);
      const success = this.mapRelations(model, table);

      if (!success) {
        this.logger.warn(`Failed to map relations for table ${table.name}`);
      }
    }
  }

  public isTableExists(tableName: string): boolean {
    return this.database.tables.some(table => table.name === tableName);
  }

  public removeTable(tableName: string): void {
    // Find a table index by name in the database tables array.
    const tableIndex = this.database.tables.findIndex(
      table => table.name === tableName,
    );

    // Remove the table from the database tables array.
    if (tableIndex !== -1) {
      this.database.tables.splice(tableIndex, 1);
    }
  }

  public getTable(tableName: string): ITable {
    const table = this.database.tables.find(table => table.name === tableName);

    if (!table) {
      throw new Error(`Table ${tableName} not found`);
    }

    return table;
  }

  public getModel<T extends Model = Model>(tableName: string): ModelClass<T> {
    const table = this.getTable(tableName);

    if (!table) {
      throw new ModelNotFound(tableName);
    }

    // Check if the table exists in the model cache, create and store if not.
    if (!this.modelCache.has(tableName)) {
      const model = this.toModel(table);
      this.modelCache.set(tableName, model);
    }

    return this.modelCache.get(tableName) as ModelClass<T>;
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
    type ColumName = string;
    type PropertyName = string;
    type ReadTransformer = (v: any) => any;
    type WriteTransformer = (v: any) => any;

    const columnToProperty = new Map<ColumName, PropertyName>();
    const propertyToColumn = new Map<PropertyName, ColumName>();

    // TODO: convert this to a single function with a chain of calls, so we can avoid the iteration
    const transformerColumnCache = new Map<ColumName, ReadTransformer[]>();
    const transformerPropertyCache = new Map<
      PropertyName,
      WriteTransformer[]
    >();

    for (const columnName in table.columns) {
      if (Object.prototype.hasOwnProperty.call(table.columns, columnName)) {
        const column = table.columns[columnName];
        const propertyName = column.meta.alias || columnName;

        // Map column names to property names
        columnToProperty.set(columnName, propertyName);
        // Map property names to column names
        propertyToColumn.set(propertyName, columnName);

        // Map setters and getters
        if (column?.meta.hooks) {
          (column.meta.hooks as ColumnHook[]).forEach(transformer => {
            // Column name maps the getters
            const readHook = HookDictionary[transformer].onRead;

            if (readHook) {
              const getters = transformerColumnCache.get(columnName) || [];
              getters.push(readHook);
              transformerColumnCache.set(columnName, getters);
            }

            // Property name maps the setters
            const writeHook = HookDictionary[transformer].onWrite;

            if (writeHook) {
              const setters = transformerPropertyCache.get(propertyName) || [];
              setters.push(writeHook);
              transformerPropertyCache.set(propertyName, setters);
            }
          });
        }
      }
    }

    model.idColumn = ColumnTools.filterPrimary(table);

    // Map database columns to code level references
    // Database -> Model = Getter
    const databaseToModel = function (dbPojo: Pojo): Pojo {
      Object.keys(dbPojo).forEach(column => {
        const property = columnToProperty.get(column)!;

        // Apply read transformers
        const readTransformer = transformerColumnCache.get(column);

        readTransformer?.forEach(transform => {
          dbPojo[column] = transform(dbPojo[column]);
        });

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

        // Apply write hooks
        const onWriteHooks = transformerPropertyCache.get(property);

        onWriteHooks?.forEach(onWrite => {
          modelPojo[property] = onWrite(modelPojo[property]);
        });

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
      const capabilities = column.meta.capabilities;

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

      if (!this.isTableExists(fk.references.table)) {
        success = false;

        continue;
      }

      const target = this.getModel(fk.references.table);
      const forwardName = fk.meta?.alias || name;

      map[forwardName] = {
        relation: Model.BelongsToOneRelation,
        modelClass: target,
        join: {
          from: fk.columns.map(column => `${table.name}.${column}`),
          to: fk.references.columns.map(column => `${target.name}.${column}`),
        },
      };

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
      }
    }

    model.relationMappings = map;

    return success;
  }
}
