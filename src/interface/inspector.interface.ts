import { Column } from 'knex-schema-inspector/dist/types/column';
import { IReverseIndex } from './reverse/reverse-index.interface';
import { IReverseUnique } from './reverse/reverse-unique.interface';
import { IRelation } from './schema/relation.interface';
import { ISchema } from './schema/schema.interface';

export interface IInspector {
  tables(): Promise<string[]>;
  columnInfo(table: string): Promise<Column[]>;
  isTypeExists(typeName: string): Promise<boolean>;
  findEnumeratorColumns(
    tableName: string,
    columns: Column[],
  ): Promise<{ column: string; values: string[] }[]>;

  getForeignKeys(tableName: string): Promise<[string, IRelation][]>;
  getUniqueConstraints(): Promise<string[]>;
  getIndexes(tableName: string): Promise<IReverseIndex[]>;
  getUniques(tableName: string): Promise<IReverseUnique[]>;
  getCompositeUniques(tableName: string): Promise<ISchema['uniques']>;
  getCompositePrimaryKeys(tableName: string): Promise<string[]>;
  getDefaultValues(
    tableName: string,
  ): Promise<{ column: string; defaultValue: string }[]>;
}
