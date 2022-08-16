import { IFacts } from '../../interface';
import { SQLBaseFactSource } from '../abstract/base.fact-source';

export class MySQLFactSource extends SQLBaseFactSource {
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
