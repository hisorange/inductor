import { Column } from 'knex-schema-inspector/dist/types/column';
import { IReverseIndex } from './reverse/reverse-index.interface';
import { IRelation } from './schema/relation.interface';
import { ISchema } from './schema/schema.interface';

export interface IFacts {
  // Altering
  addNewTable: (tableName: string) => void;

  isTableExists(tableName: string): boolean;
  isUniqueConstraintExists(constraintName: string): boolean;

  getListOfTables(filters: string[]): string[];

  // Table oriented methods
  getTableColumns(tableName: string): Promise<Column[]>;
  getTablePrimaryKeys(tableName: string): Promise<string[]>;
  getTableUniques(tableName: string): Promise<ISchema['uniques']>;
  getTableIndexes(tableName: string): Promise<IReverseIndex[]>;
  getTableDefaultValues(
    tableName: string,
  ): Promise<{ column: string; defaultValue: string }[]>;
  findEnumeratorColumns(
    tableName: string,
    columns: Column[],
  ): Promise<{ column: string; values: string[] }[]>;

  getTableForeignKeys(tableName: string): Promise<[string, IRelation][]>;

  refresh(): Promise<void>;
}
