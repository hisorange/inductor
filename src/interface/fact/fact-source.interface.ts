import { Column } from 'knex-schema-inspector/dist/types/column';
import { IFacts } from './facts.interface';

export interface IFactSource {
  tables(): Promise<string[]>;
  columnInfo(table: string): Promise<Column[]>;
  getEnumerators(): Promise<IFacts['enumerators']>;
  getRelations(): Promise<IFacts['relations']>;
  getUniqueConstraints(): Promise<string[]>;
  getIndexes(): Promise<IFacts['indexes']>;
  getUniques(): Promise<IFacts['uniques']>;
  getCompositePrimaryKeys(): Promise<IFacts['compositePrimaryKeys']>;
  getColumnValues(): Promise<IFacts['columnValues']>;
  getDefinedTypes(): Promise<string[]>;
  isTableHasRows(tableName: string): Promise<boolean>;
}
