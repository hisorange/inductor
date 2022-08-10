import { Column } from 'knex-schema-inspector/dist/types/column';
import { IReverseIndex } from './reverse/reverse-index.interface';
import { IRelation } from './schema/relation.interface';
import { ISchema } from './schema/schema.interface';

export interface IFacts {
  isTableExists(tableName: string): boolean;
  isUniqueConstraintExists(constraintName: string): boolean;

  getListOfTables(filters: string[]): string[];

  // Table oriented methods
  getColumns(tableName: string): Promise<Column[]>;
  getCompositePrimaryKeys(tableName: string): Promise<string[]>;
  getCompositeUniques(tableName: string): Promise<ISchema['uniques']>;
  getIndexes(tableName: string): Promise<IReverseIndex[]>;
  getDefaultValues(
    tableName: string,
  ): Promise<{ column: string; defaultValue: string }[]>;
  findEnumeratorColumns(
    tableName: string,
    columns: Column[],
  ): Promise<{ column: string; values: string[] }[]>;

  getForeignKeys(tableName: string): Promise<[string, IRelation][]>;

  refresh(): Promise<void>;
}
