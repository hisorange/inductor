import { IBlueprint, IColumn, IRelation } from '../../blueprint';

export interface IFactCollector {
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
    [columnName: string]: {
      defaultValue: IColumn['defaultValue'];
      isNullable: boolean;
      typeName: string;
      maxLength: number | null;
      precision: number | null;
      scale: number | null;
      comment: string | null;
    };
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

  gather(): Promise<void>;
}
