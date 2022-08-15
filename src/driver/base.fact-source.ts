import { Knex } from 'knex';
import { IFacts, IFactSource } from '../interface';

export abstract class BaseFactSource implements IFactSource {
  constructor(readonly knex: Knex) {}

  async isTableHasRows(tableName: string): Promise<boolean> {
    const countResult = await this.knex
      .select()
      .from(tableName)
      .limit(1)
      .count('* as count');

    if (countResult[0].count > 0) {
      return true;
    }

    return false;
  }

  abstract getTables(): Promise<string[]>;
  abstract getEnumerators(): Promise<IFacts['enumerators']>;
  abstract getRelations(): Promise<IFacts['relations']>;
  abstract getUniqueConstraints(): Promise<string[]>;
  abstract getIndexes(): Promise<IFacts['indexes']>;
  abstract getUniques(): Promise<IFacts['uniques']>;
  abstract getCompositePrimaryKeys(): Promise<IFacts['compositePrimaryKeys']>;
  abstract getColumnValues(): Promise<IFacts['columnValues']>;
  abstract getDefinedTypes(): Promise<string[]>;
}
