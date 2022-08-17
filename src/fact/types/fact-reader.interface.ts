import { Knex } from 'knex';
import { IFactManager } from './fact-manager.interface';

export interface IFactReader {
  readonly knex: Knex;

  getTables(): Promise<string[]>;
  getEnumerators(): Promise<IFactManager['facts']['enumerators']>;
  getRelations(): Promise<IFactManager['facts']['relations']>;
  getUniqueConstraints(): Promise<string[]>;
  getIndexes(): Promise<IFactManager['facts']['indexes']>;
  getUniques(): Promise<IFactManager['facts']['uniques']>;
  getCompositePrimaryKeys(): Promise<
    IFactManager['facts']['compositePrimaryKeys']
  >;
  getColumnValues(): Promise<IFactManager['facts']['columnValues']>;
  getDefinedTypes(): Promise<string[]>;
  isTableHasRows(tableName: string): Promise<boolean>;
}
