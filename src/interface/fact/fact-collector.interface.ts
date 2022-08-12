import { Column } from 'knex-schema-inspector/dist/types/column';
import { IBlueprint } from '../blueprint/blueprint.interface';
import { IRelation } from '../blueprint/relation.interface';
import { IReverseIndex } from '../reverse/reverse-index.interface';

export interface IFactCollector {
  // Add live changes
  addNewTable(tableName: string): void;
  addNewUniqueConstraint(constraintName: string): void;

  isTableExists(tableName: string): boolean;
  isUniqueConstraintExists(constraintName: string): boolean;
  isTypeExists(typeName: string): boolean;

  getListOfTables(filters: string[]): string[];

  // Reverse calls
  getTableColumns(tableName: string): Promise<Column[]>;
  getTablePrimaryKeys(tableName: string): Promise<string[]>;
  getTableUniques(tableName: string): Promise<IBlueprint['uniques']>;
  getTableIndexes(tableName: string): Promise<IReverseIndex[]>;
  getTableDefaultValues(
    tableName: string,
  ): Promise<{ column: string; defaultValue: string }[]>;
  findEnumeratorColumns(
    tableName: string,
    columns: Column[],
  ): Promise<{ column: string; values: string[] }[]>;

  getTableForeignKeys(tableName: string): [string, IRelation][];
  addTableForeignKey(
    tableName: string,
    name: string,
    definition: IRelation,
  ): void;

  isTableHasRows(tableName: string): Promise<boolean>;

  gather(): Promise<void>;
}
