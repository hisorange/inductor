import { Column } from 'knex-schema-inspector/dist/types/column';
import { IBlueprint } from './interface/blueprint/blueprint.interface';
import { IRelation } from './interface/blueprint/relation.interface';
import { IFacts } from './interface/facts.interface';
import { IInspector } from './interface/inspector.interface';
import { IReverseIndex } from './interface/reverse/reverse-index.interface';

export class Facts implements IFacts {
  protected tables: string[] = [];
  protected uniqueConstraints: string[] = [];
  protected typeNames: string[] = [];

  constructor(protected inspector: IInspector) {}

  isTypeExists(typeName: string): boolean {
    return this.typeNames.includes(typeName);
  }

  addNewTable(tableName: string) {
    this.tables.push(tableName);
  }

  addNewUniqueConstraint(constraintName: string): void {
    this.uniqueConstraints.push(constraintName);
  }

  async refresh(): Promise<void> {
    this.tables = await this.inspector.tables(); // TODO remove this and query the types with table indicator
    this.uniqueConstraints = await this.inspector.getUniqueConstraints();
    this.typeNames = await this.inspector.getDefinedTypes();
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

  async getTablePrimaryKeys(tableName: string): Promise<string[]> {
    return this.inspector.getCompositePrimaryKeys(tableName);
  }

  async getTableUniques(tableName: string): Promise<IBlueprint['uniques']> {
    return this.inspector.getCompositeUniques(tableName);
  }

  async getTableIndexes(tableName: string): Promise<IReverseIndex[]> {
    return this.inspector.getIndexes(tableName);
  }

  async getTableDefaultValues(
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

  async getTableForeignKeys(tableName: string): Promise<[string, IRelation][]> {
    return this.inspector.getForeignKeys(tableName);
  }

  async getTableColumns(tableName: string): Promise<Column[]> {
    return this.inspector.columnInfo(tableName);
  }

  isTableExists(tableName: string): boolean {
    return this.tables.includes(tableName);
  }

  isUniqueConstraintExists(constraintName: string): boolean {
    return this.uniqueConstraints.includes(constraintName);
  }
}
