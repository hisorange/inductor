import { Knex } from 'knex';
import { IFacts } from './facts.interface';

export interface IFactSource {
  readonly knex: Knex;

  getTables(): Promise<string[]>;
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
