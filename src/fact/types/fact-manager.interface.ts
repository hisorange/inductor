import { IBlueprint, IColumn, IRelation } from '../../blueprint';

type ColumnInfo = {
  defaultValue: IColumn['defaultValue'];
  isNullable: boolean;
  typeName: string;
  maxLength: number | null;
  precision: number | null;
  scale: number | null;
  comment: string | null;
};

export interface IFactManager {
  readonly facts: {
    tables: string[];
    types: string[];
    uniqueConstraints: string[];
    uniques: {
      [tableName: string]: IBlueprint['uniques'];
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
      [tableName: string]: IBlueprint['indexes'];
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

  getBlueprintForTable(table: string): IBlueprint;

  // Add live changes
  addTable(tableName: string): void;
  addUnique(constraintName: string): void;

  isTableExists(tableName: string): boolean;
  isUniqueConstraintExists(constraintName: string): boolean;
  isTypeExists(typeName: string): boolean;

  getTables(filters: string[]): string[];

  // Reverse calls
  getTablePrimaryKeys(tableName: string): string[];
  getTableUniques(tableName: string): IBlueprint['uniques'];
  getTableIndexes(tableName: string): IBlueprint['indexes'];
  getTableColumnInfo(tableName: string): {
    [columnName: string]: ColumnInfo;
  };

  getTableEnumerators(tableName: string): {
    [columnName: string]: {
      nativeType: string;
      values: string[];
    };
  };

  getTableForeignKeys(tableName: string): IBlueprint['relations'];
  addTableForeignKey(
    tableName: string,
    name: string,
    definition: IRelation,
  ): void;

  isTableHasRows(tableName: string): Promise<boolean>;

  updateFacts(): Promise<void>;
}
