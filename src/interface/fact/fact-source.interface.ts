import { Column } from 'knex-schema-inspector/dist/types/column';
import { IFacts } from './facts.interface';

export interface IFactSource {
  tables(): Promise<string[]>;
  columnInfo(table: string): Promise<Column[]>;
  isTypeExists(typeName: string): Promise<boolean>;
  findEnumeratorColumns(
    tableName: string,
    columns: Column[],
  ): Promise<{ column: string; values: string[] }[]>;

  getRelations(): Promise<IFacts['relations']>;
  getUniqueConstraints(): Promise<string[]>;
  getIndexes(): Promise<IFacts['indexes']>;
  getUniques(): Promise<IFacts['uniques']>;
  getCompositePrimaryKeys(): Promise<IFacts['compositePrimaryKeys']>;
  getDefaultValues(
    tableName: string,
  ): Promise<{ column: string; defaultValue: string }[]>;

  getDefinedTypes(): Promise<string[]>;
  isTableHasRows(tableName: string): Promise<boolean>;
}
