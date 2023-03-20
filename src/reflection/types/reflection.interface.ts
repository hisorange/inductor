import { IColumn, IRelation, ITable } from '../../table';

type ColumnInfo = {
  defaultValue: IColumn['defaultValue'];
  isNullable: boolean;
  typeName: string;
  maxLength: number | null;
  precision: number | null;
  scale: number | null;
  comment: string | null;
};

export interface IReflection {
  readonly facts: {
    tables: string[];
    unloggedTables: string[];
    types: string[];
    uniqueConstraints: string[];
    uniques: {
      [tableName: string]: ITable['uniques'];
    };
    relations: {
      [tableName: string]: {
        [foreignKeyName: string]: IRelation;
      };
    };
    tableRowChecks: Map<string, boolean>;
    compositePrimaryKeys: {
      [tableName: string]: string[];
    };
    indexes: {
      [tableName: string]: ITable['indexes'];
    };
    columnValues: {
      [tableName: string]: {
        [columnName: string]: ColumnInfo;
      };
    };
    enumerators: {
      [tableName: string]: {
        [columnName: string]: {
          nativeType: string;
          values: string[];
        };
      };
    };
  };

  getTableState(table: string): ITable;

  // Add live changes
  addTable(tableName: string): void;
  addUnique(constraintName: string): void;

  isTableExists(tableName: string): boolean;
  isUniqueConstraintExists(constraintName: string): boolean;
  isTypeExists(typeName: string): boolean;

  getTables(filters: string[]): string[];

  // Reverse calls
  getTablePrimaryKeys(tableName: string): string[];
  getTableUniques(tableName: string): ITable['uniques'];
  getTableIndexes(tableName: string): ITable['indexes'];
  getTableColumnInfo(tableName: string): {
    [columnName: string]: ColumnInfo;
  };

  getTableEnumerators(tableName: string): {
    [columnName: string]: {
      nativeType: string;
      values: string[];
    };
  };

  getTableForeignKeys(tableName: string): ITable['relations'];
  addTableForeignKey(
    tableName: string,
    name: string,
    definition: IRelation,
  ): void;

  isTableHasRows(tableName: string): Promise<boolean>;

  updateFacts(): Promise<void>;
}
