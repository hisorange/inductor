import { Knex } from 'knex';
import { ColumnType } from '../types/column-type.enum';
import { IColumn } from '../types/column.interface';
import { IDatabaseState } from '../types/database-state.interface';
import { IndexType } from '../types/index-type.enum';
import { IRelation } from '../types/relation.interface';
import { ITable } from '../types/table.interface';
import { ColumnTools } from '../utils/column-tools';
import { decodeComments } from '../utils/comment.coder';
import { readRowCount } from './reflectors/row-count.reader';
import { InitiateTable } from './table.initiator';
import { ValidateTable } from './table.validator';

export class Reflection {
  constructor(readonly connection: Knex, public state: IDatabaseState) {}

  getTableState(tableName: string): ITable {
    const table = InitiateTable(tableName);
    table.relations = this.getTableForeignKeys(tableName);
    table.uniques = this.getTableUniques(tableName);
    table.indexes = this.getTableIndexes(tableName);

    // Check if the table is unlogged
    if (this.state.unloggedTables.includes(tableName)) {
      table.isLogged = false;
    }

    const compositePrimaryKeys = this.getTablePrimaryKeys(tableName);
    const columns = this.getTableColumnInfo(tableName);
    const enumerators = this.getTableEnumerators(tableName);

    const singleColumnIndexes = new Map<string, IndexType>();
    const singleColumnUniques = new Set<string>();

    // Remove non-composite indexes
    for (const index in table.indexes) {
      if (Object.prototype.hasOwnProperty.call(table.indexes, index)) {
        const definition = table.indexes[index];

        if (definition.columns.length === 1) {
          singleColumnIndexes.set(definition.columns[0], definition.type);

          delete table.indexes[index];
        }
      }
    }

    // Remove non-composite uniques
    for (const constraint in table.uniques) {
      if (Object.prototype.hasOwnProperty.call(table.uniques, constraint)) {
        const definition = table.uniques[constraint];

        if (definition.columns.length < 2) {
          singleColumnUniques.add(definition.columns[0]);
          delete table.uniques[constraint];
        }
      }
    }

    for (const columnName of Object.keys(columns)) {
      const columnInfo = columns[columnName];
      const columnDef: IColumn = {
        type: {
          name: columnInfo.typeName,
        } as IColumn['type'],
        isNullable: columnInfo.isNullable,
        isUnique: singleColumnUniques.has(columnName),
        isPrimary: compositePrimaryKeys.includes(columnName),
        isIndexed: false,
        defaultValue: columnInfo.defaultValue,
        capabilities: [],
      };

      if (columnInfo.comment) {
        decodeComments(columnDef, columnInfo.comment);
      }

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

      table.columns[columnName] = columnDef;
    }

    ValidateTable(table);

    return table;
  }

  isTypeExists(name: string): boolean {
    return this.state.types.includes(name);
  }

  addTable(table: string) {
    this.state.tables.push(table);
  }

  removeTable(table: string) {
    this.state.tables = this.state.tables.filter(t => t !== table);
  }

  async isTableHasRows(table: string): Promise<boolean> {
    if (!this.state.tableRowChecks.has(table)) {
      this.state.tableRowChecks.set(
        table,
        await readRowCount(this.connection, table),
      );
    }

    return this.state.tableRowChecks.get(table)!;
  }

  addUnique(constraint: string): void {
    this.state.uniqueConstraints.push(constraint);
  }

  getTables(filters: string[] = []): string[] {
    return this.state.tables.filter(table => {
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
    return this.state.compositePrimaryKeys.hasOwnProperty(table)
      ? this.state.compositePrimaryKeys[table]
      : [];
  }

  getTableUniques(table: string): ITable['uniques'] {
    return this.state.uniques.hasOwnProperty(table)
      ? this.state.uniques[table]
      : {};
  }

  getTableIndexes(table: string): ITable['indexes'] {
    return this.state.indexes.hasOwnProperty(table)
      ? this.state.indexes[table]
      : {};
  }

  getTableColumnInfo(table: string) {
    return this.state.columnValues.hasOwnProperty(table)
      ? this.state.columnValues[table]
      : {};
  }

  getTableEnumerators(table: string): {
    [columnName: string]: {
      nativeType: string;
      values: string[];
    };
  } {
    return this.state.enumerators.hasOwnProperty(table)
      ? this.state.enumerators[table]
      : {};
  }

  getTableForeignKeys(table: string): ITable['relations'] {
    return this.state.relations.hasOwnProperty(table)
      ? this.state.relations[table]
      : {};
  }

  addTableForeignKey(table: string, name: string, definition: IRelation): void {
    if (!this.state.relations.hasOwnProperty(table)) {
      this.state.relations[table] = {};
    }

    this.state.relations[table][name] = definition;
  }

  isTableExists(table: string): boolean {
    return this.state.tables.includes(table);
  }

  isUniqueConstraintExists(constraint: string): boolean {
    return this.state.uniqueConstraints.includes(constraint);
  }
}
