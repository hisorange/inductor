import { Column } from 'knex-schema-inspector/dist/types/column';
import { PostgresInspector } from './driver/postgres/postgres.inspector';
import { IFacts } from './interface/facts.interface';
import { IReverseIndex } from './interface/reverse/reverse-index.interface';
import { IRelation } from './interface/schema/relation.interface';
import { ISchema } from './interface/schema/schema.interface';

export class Facts implements IFacts {
  protected tables: string[] = [];
  protected uniqueConstraints: string[] = [];

  constructor(protected inspector: PostgresInspector) {}

  async refresh(): Promise<void> {
    this.tables = await this.inspector.tables();
    this.uniqueConstraints = await this.inspector.getUniqueConstraints();
  }

  getListOfTables(filters: string[] = []): string[] {
    return this.tables.filter(table => {
      // Empty filter
      if (filters.length === 0) {
        return true;
      }

      // Simple match filter
      for (const filter of filters) {
        if (new RegExp(filter).test(table)) {
          return true;
        }
      }

      return false;
    });
  }

  async getCompositePrimaryKeys(tableName: string): Promise<string[]> {
    return this.inspector.getCompositePrimaryKeys(tableName);
  }

  async getCompositeUniques(tableName: string): Promise<ISchema['uniques']> {
    return this.inspector.getCompositeUniques(tableName);
  }

  async getIndexes(tableName: string): Promise<IReverseIndex[]> {
    return this.inspector.getIndexes(tableName);
  }

  async getDefaultValues(
    tableName: string,
  ): Promise<{ column: string; defaultValue: string }[]> {
    return this.inspector.getDefaultValues(tableName);
  }

  async findEnumeratorColumns(
    tableName: string,
    columns: Column[],
  ): Promise<{ column: string; values: string[] }[]> {
    return this.inspector.findEnumeratorColumns(tableName, columns);
  }

  async getForeignKeys(tableName: string): Promise<[string, IRelation][]> {
    return this.inspector.getForeignKeys(tableName);
  }

  async getColumns(tableName: string): Promise<Column[]> {
    return this.inspector.columnInfo(tableName);
  }

  isTableExists(tableName: string): boolean {
    return this.tables.includes(tableName);
  }

  isUniqueConstraintExists(constraintName: string): boolean {
    return this.uniqueConstraints.includes(constraintName);
  }
}
