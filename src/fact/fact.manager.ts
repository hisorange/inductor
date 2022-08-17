import {
  ColumnKind,
  ColumnType,
  IBlueprint,
  IColumn,
  IndexType,
  initBlueprint,
  IRelation,
  validateBlueprint,
} from '../blueprint';
import { ColumnTools } from '../tools/column-tools';
import { IFactManager } from './types/fact-manager.interface';
import { IFactReader } from './types/fact-reader.interface';

export class FactManager implements IFactManager {
  readonly facts: IFactManager['facts'] = {
    tables: [],
    types: [],
    uniqueConstraints: [],
    uniques: {},
    relations: {},
    tableRowChecks: new Map<string, boolean>(),
    compositePrimaryKeys: {},
    indexes: {},
    columnValues: {},
    enumerators: {},
  };

  constructor(protected reader: IFactReader) {}

  getBlueprintForTable(tableName: string): IBlueprint {
    const blueprint = initBlueprint(tableName);
    blueprint.relations = this.getTableForeignKeys(tableName);
    blueprint.uniques = this.getTableUniques(tableName);
    blueprint.indexes = this.getTableIndexes(tableName);

    const compositePrimaryKeys = this.getTablePrimaryKeys(tableName);
    const columns = this.getTableColumnInfo(tableName);
    const enumerators = this.getTableEnumerators(tableName);

    const singleColumnIndexes = new Map<string, IndexType>();
    const singleColumnUniques = new Set<string>();

    // Remove non-composite indexes
    for (const index in blueprint.indexes) {
      if (Object.prototype.hasOwnProperty.call(blueprint.indexes, index)) {
        const definition = blueprint.indexes[index];

        if (definition.columns.length === 1) {
          singleColumnIndexes.set(definition.columns[0], definition.type);

          delete blueprint.indexes[index];
        }
      }
    }

    // Remove non-composite uniques
    for (const constraint in blueprint.uniques) {
      if (Object.prototype.hasOwnProperty.call(blueprint.uniques, constraint)) {
        const definition = blueprint.uniques[constraint];

        if (definition.columns.length < 2) {
          singleColumnUniques.add(definition.columns[0]);
          delete blueprint.uniques[constraint];
        }
      }
    }

    for (const columnName of Object.keys(columns)) {
      const columnInfo = columns[columnName];
      const columnDef: IColumn = {
        type: {
          name: columnInfo.typeName,
        } as IColumn['type'],
        kind: ColumnKind.COLUMN,
        isNullable: columnInfo.isNullable,
        isUnique: singleColumnUniques.has(columnName),
        isPrimary: compositePrimaryKeys.includes(columnName),
        isIndexed: false,
        defaultValue: columnInfo.defaultValue,
      };

      columnDef.isIndexed = singleColumnIndexes.has(columnName)
        ? singleColumnIndexes.get(columnName)!
        : false;

      // Enum column check
      if (enumerators.hasOwnProperty(columnName)) {
        columnDef.type = {
          name: ColumnType.ENUM,
          values: enumerators[columnName].values,
          nativeName: enumerators[columnName].nativeType,
        };
      }

      // Determine if the column is a serial
      if (
        typeof columnDef.defaultValue === 'string' &&
        columnDef.defaultValue.toLowerCase().startsWith('nextval')
      ) {
        columnDef.isPrimary = true;

        switch (columnDef.type.name) {
          case ColumnType.SMALLINT:
            columnDef.type.name = ColumnType.SMALLSERIAL;
            break;
          case ColumnType.INTEGER:
            columnDef.type.name = ColumnType.SERIAL;
            break;
          case ColumnType.BIGINT:
            columnDef.type.name = ColumnType.BIGSERIAL;
            break;
        }
      }

      // Primary/serial cannot be unique or nullable
      if (columnDef.isPrimary) {
        columnDef.isNullable = false;
        columnDef.isUnique = false;
      }

      // Check for precision
      if (ColumnTools.isTypeRequiresPrecision(columnDef.type.name)) {
        (columnDef.type as any).precision = columnInfo.precision;
      }
      // Check for scale
      if (ColumnTools.isTypeRequiresScale(columnDef.type.name)) {
        (columnDef.type as any).scale = columnInfo.scale;
      }
      // Check for length
      if (ColumnTools.isTypeRequiresLength(columnDef.type.name)) {
        (columnDef.type as any).length = columnInfo.maxLength;
      }

      // Numeric can have precision and scale
      if (ColumnType.NUMERIC === columnDef.type.name) {
        // Check if the precision is set
        if (columnInfo.precision !== null) {
          (columnDef.type as any).precision = columnInfo.precision;
        }

        // Check if the scale is set
        if (columnInfo.scale !== null) {
          (columnDef.type as any).scale = columnInfo.scale;
        }
      }

      // JSON columns need to get converted to strings
      if (typeof columnDef.defaultValue === 'string') {
        // JSON columns need to get converted to strings
        if (
          columnDef.type.name === ColumnType.JSON ||
          columnDef.type.name === ColumnType.JSONB
        ) {
          try {
            columnDef.defaultValue = JSON.parse(columnDef.defaultValue);
          } catch (error) {}
        }
        // Boolean columns need to get converted to booleans
        else if (columnDef.type.name === ColumnType.BOOLEAN) {
          columnDef.defaultValue = columnDef.defaultValue === 'true';
        }
        // Numeric columns need to get converted to numbers
        else if (ColumnTools.isFloatType(columnDef)) {
          columnDef.defaultValue = parseFloat(columnDef.defaultValue);

          if (isNaN(columnDef.defaultValue)) {
            columnDef.defaultValue = undefined;
          }
        }
        // Integer columns need to get converted to numbers
        else if (ColumnTools.isIntegerType(columnDef)) {
          columnDef.defaultValue = parseInt(columnDef.defaultValue, 10);

          if (isNaN(columnDef.defaultValue)) {
            columnDef.defaultValue = undefined;
          }
        }
      }

      blueprint.columns[columnName] = columnDef;
    }

    validateBlueprint(blueprint);

    return blueprint;
  }

  isTypeExists(name: string): boolean {
    return this.facts.types.includes(name);
  }

  addTable(table: string) {
    this.facts.tables.push(table);
  }

  async isTableHasRows(table: string): Promise<boolean> {
    if (!this.facts.tableRowChecks.has(table)) {
      this.facts.tableRowChecks.set(
        table,
        await this.reader.isTableHasRows(table),
      );
    }

    return this.facts.tableRowChecks.get(table)!;
  }

  addUnique(constraint: string): void {
    this.facts.uniqueConstraints.push(constraint);
  }

  async updateFacts(): Promise<void> {
    const [
      tables,
      types,
      uniqueConstraints,
      relations,
      uniques,
      compositePrimaryKeys,
      indexes,
      columnValues,
      enumerators,
    ] = await Promise.all([
      this.reader.getTables(),
      this.reader.getDefinedTypes(),
      this.reader.getUniqueConstraints(),
      this.reader.getRelations(),
      this.reader.getUniques(),
      this.reader.getCompositePrimaryKeys(),
      this.reader.getIndexes(),
      this.reader.getColumnValues(),
      this.reader.getEnumerators(),
    ]);

    this.facts.types = types;
    this.facts.tables = tables;
    this.facts.uniques = uniques;
    this.facts.relations = relations;
    this.facts.uniqueConstraints = uniqueConstraints;
    this.facts.tableRowChecks = new Map<string, boolean>();
    this.facts.compositePrimaryKeys = compositePrimaryKeys;
    this.facts.indexes = indexes;
    this.facts.columnValues = columnValues;
    this.facts.enumerators = enumerators;

    //console.log(inspect(this.facts, false, 5, true));
  }

  getTables(filters: string[] = []): string[] {
    return this.facts.tables.filter(table => {
      // Empty filter
      if (filters.length === 0) {
        return true;
      }

      // Simple match filter
      for (const filter of filters) {
        if (new RegExp(filter).test(table)) {
          return true;
        }
      }

      return false;
    });
  }

  getTablePrimaryKeys(table: string): string[] {
    return this.facts.compositePrimaryKeys.hasOwnProperty(table)
      ? this.facts.compositePrimaryKeys[table]
      : [];
  }

  getTableUniques(table: string): IBlueprint['uniques'] {
    return this.facts.uniques.hasOwnProperty(table)
      ? this.facts.uniques[table]
      : {};
  }

  getTableIndexes(table: string): IBlueprint['indexes'] {
    return this.facts.indexes.hasOwnProperty(table)
      ? this.facts.indexes[table]
      : {};
  }

  getTableColumnInfo(table: string) {
    return this.facts.columnValues.hasOwnProperty(table)
      ? this.facts.columnValues[table]
      : {};
  }

  getTableEnumerators(table: string): {
    [columnName: string]: {
      nativeType: string;
      values: string[];
    };
  } {
    return this.facts.enumerators.hasOwnProperty(table)
      ? this.facts.enumerators[table]
      : {};
  }

  getTableForeignKeys(table: string): IBlueprint['relations'] {
    return this.facts.relations.hasOwnProperty(table)
      ? this.facts.relations[table]
      : {};
  }

  addTableForeignKey(table: string, name: string, definition: IRelation): void {
    if (!this.facts.relations.hasOwnProperty(table)) {
      this.facts.relations[table] = {};
    }

    this.facts.relations[table][name] = definition;
  }

  isTableExists(table: string): boolean {
    return this.facts.tables.includes(table);
  }

  isUniqueConstraintExists(constraint: string): boolean {
    return this.facts.uniqueConstraints.includes(constraint);
  }
}
