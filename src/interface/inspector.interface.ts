import { Column } from 'knex-schema-inspector/dist/types/column';
import { IBlueprint } from './blueprint/blueprint.interface';
import { IForeginKeyFact } from './fact/foreign-key.fact';
import { IReverseIndex } from './reverse/reverse-index.interface';
import { IReverseUnique } from './reverse/reverse-unique.interface';

export interface IInspector {
  tables(): Promise<string[]>;
  columnInfo(table: string): Promise<Column[]>;
  isTypeExists(typeName: string): Promise<boolean>;
  findEnumeratorColumns(
    tableName: string,
    columns: Column[],
  ): Promise<{ column: string; values: string[] }[]>;

  getForeignKeys(): Promise<IForeginKeyFact>;
  getUniqueConstraints(): Promise<string[]>;
  getIndexes(tableName: string): Promise<IReverseIndex[]>;
  getUniques(tableName: string): Promise<IReverseUnique[]>;
  getCompositeUniques(tableName: string): Promise<IBlueprint['uniques']>;
  getCompositePrimaryKeys(tableName: string): Promise<string[]>;
  getDefaultValues(
    tableName: string,
  ): Promise<{ column: string; defaultValue: string }[]>;

  getDefinedTypes(): Promise<string[]>;
  isTableHasRows(tableName: string): Promise<boolean>;
}
