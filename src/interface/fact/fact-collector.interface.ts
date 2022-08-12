import { Column } from 'knex-schema-inspector/dist/types/column';
import { IBlueprint } from '../blueprint/blueprint.interface';
import { IRelation } from '../blueprint/relation.interface';

export interface IFactCollector {
  // Add live changes
  addTable(tableName: string): void;
  addUnique(constraintName: string): void;

  isTableExists(tableName: string): boolean;
  isUniqueConstraintExists(constraintName: string): boolean;
  isTypeExists(typeName: string): boolean;

  getTables(filters: string[]): string[];

  // Reverse calls
  getTableColumns(tableName: string): Promise<Column[]>;
  getTablePrimaryKeys(tableName: string): string[];
  getTableUniques(tableName: string): IBlueprint['uniques'];
  getTableIndexes(tableName: string): IBlueprint['indexes'];
  getTableDefaultValues(
    tableName: string,
  ): Promise<{ column: string; defaultValue: string }[]>;
  findEnumeratorColumns(
    tableName: string,
    columns: Column[],
  ): Promise<{ column: string; values: string[] }[]>;

  getTableForeignKeys(tableName: string): IBlueprint['relations'];
  addTableForeignKey(
    tableName: string,
    name: string,
    definition: IRelation,
  ): void;

  isTableHasRows(tableName: string): Promise<boolean>;

  gather(): Promise<void>;
}
