import { Knex } from 'knex';
import { IFacts, IFactSource } from '../../interface';

export abstract class SQLBaseFactSource implements IFactSource {
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

  async getTables(): Promise<string[]> {
    return [];
  }

  async getEnumerators(): Promise<IFacts['enumerators']> {
    return {};
  }
  async getRelations(): Promise<IFacts['relations']> {
    return {};
  }
  async getUniqueConstraints(): Promise<string[]> {
    return [];
  }
  async getIndexes(): Promise<IFacts['indexes']> {
    return {};
  }
  async getUniques(): Promise<IFacts['uniques']> {
    return {};
  }
  async getCompositePrimaryKeys(): Promise<IFacts['compositePrimaryKeys']> {
    return {};
  }
  async getColumnValues(): Promise<IFacts['columnValues']> {
    return {};
  }
  async getDefinedTypes(): Promise<string[]> {
    return [];
  }
}
