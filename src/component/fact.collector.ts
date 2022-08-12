import { Column } from 'knex-schema-inspector/dist/types/column';
import { IBlueprint } from '../interface/blueprint/blueprint.interface';
import { IRelation } from '../interface/blueprint/relation.interface';
import { IFactCollector } from '../interface/fact/fact-collector.interface';
import { IFactSource } from '../interface/fact/fact-source.interface';
import { IForeginKeyFact } from '../interface/fact/foreign-key.fact';
import { IReverseIndex } from '../interface/reverse/reverse-index.interface';

export class FactCollector implements IFactCollector {
  protected tables: string[] = [];
  protected uniqueConstraints: string[] = [];
  protected typeNames: string[] = [];
  protected tableRowChecks = new Map<string, boolean>();
  protected foreignKeysFacts: IForeginKeyFact = {};

  constructor(protected factSource: IFactSource) {}

  isTypeExists(typeName: string): boolean {
    return this.typeNames.includes(typeName);
  }

  addNewTable(tableName: string) {
    this.tables.push(tableName);
  }

  async isTableHasRows(tableName: string): Promise<boolean> {
    if (!this.tableRowChecks.has(tableName)) {
      this.tableRowChecks.set(
        tableName,
        await this.factSource.isTableHasRows(tableName),
      );
    }

    return this.tableRowChecks.get(tableName)!;
  }

  addNewUniqueConstraint(constraintName: string): void {
    this.uniqueConstraints.push(constraintName);
  }

  async gather(): Promise<void> {
    this.tables = await this.factSource.tables(); // TODO remove this and query the types with table indicator
    this.uniqueConstraints = await this.factSource.getUniqueConstraints();
    this.typeNames = await this.factSource.getDefinedTypes();
    this.tableRowChecks = new Map<string, boolean>();
    this.foreignKeysFacts = await this.factSource.getForeignKeys();
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
    return this.factSource.getCompositePrimaryKeys(tableName);
  }

  async getTableUniques(tableName: string): Promise<IBlueprint['uniques']> {
    return this.factSource.getCompositeUniques(tableName);
  }

  async getTableIndexes(tableName: string): Promise<IReverseIndex[]> {
    return this.factSource.getIndexes(tableName);
  }

  async getTableDefaultValues(
    tableName: string,
  ): Promise<{ column: string; defaultValue: string }[]> {
    return this.factSource.getDefaultValues(tableName);
  }

  async findEnumeratorColumns(
    tableName: string,
    columns: Column[],
  ): Promise<{ column: string; values: string[] }[]> {
    return this.factSource.findEnumeratorColumns(tableName, columns);
  }

  getTableForeignKeys(tableName: string): [string, IRelation][] {
    if (this.foreignKeysFacts.hasOwnProperty(tableName)) {
      return Object.keys(this.foreignKeysFacts[tableName]).map(key => [
        key,
        this.foreignKeysFacts[tableName][key],
      ]);
    }

    return [];
  }

  addTableForeignKey(
    tableName: string,
    name: string,
    definition: IRelation<unknown>,
  ): void {
    if (!this.foreignKeysFacts.hasOwnProperty(tableName)) {
      this.foreignKeysFacts[tableName] = {};
    }

    this.foreignKeysFacts[tableName][name] = definition;
  }

  async getTableColumns(tableName: string): Promise<Column[]> {
    return this.factSource.columnInfo(tableName);
  }

  isTableExists(tableName: string): boolean {
    return this.tables.includes(tableName);
  }

  isUniqueConstraintExists(constraintName: string): boolean {
    return this.uniqueConstraints.includes(constraintName);
  }
}
