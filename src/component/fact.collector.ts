import { Column } from 'knex-schema-inspector/dist/types/column';
import { IColumn } from '../interface';
import { IBlueprint } from '../interface/blueprint/blueprint.interface';
import { IRelation } from '../interface/blueprint/relation.interface';
import { IFactCollector } from '../interface/fact/fact-collector.interface';
import { IFactSource } from '../interface/fact/fact-source.interface';
import { IFacts } from '../interface/fact/facts.interface';
import { createFacts } from '../util/create-facts';

export class FactCollector implements IFactCollector {
  protected facts: IFacts = createFacts();

  constructor(protected factSource: IFactSource) {}

  isTypeExists(name: string): boolean {
    return this.facts.types.includes(name);
  }

  addTable(table: string) {
    this.facts.tables.push(table);
  }

  async isTableHasRows(table: string): Promise<boolean> {
    if (!this.facts.tableRowChecks.has(table)) {
      this.facts.tableRowChecks.set(
        table,
        await this.factSource.isTableHasRows(table),
      );
    }

    return this.facts.tableRowChecks.get(table)!;
  }

  addUnique(constraint: string): void {
    this.facts.uniqueConstraints.push(constraint);
  }

  async gather(): Promise<void> {
    const [
      tables,
      types,
      uniqueConstraints,
      relations,
      uniques,
      compositePrimaryKeys,
      indexes,
      defaultValues,
    ] = await Promise.all([
      this.factSource.tables(),
      this.factSource.getDefinedTypes(),
      this.factSource.getUniqueConstraints(),
      this.factSource.getRelations(),
      this.factSource.getUniques(),
      this.factSource.getCompositePrimaryKeys(),
      this.factSource.getIndexes(),
      this.factSource.getDefaultValues(),
    ]);

    this.facts = {
      types,
      tables,
      uniques,
      relations,
      uniqueConstraints,
      tableRowChecks: new Map<string, boolean>(),
      compositePrimaryKeys,
      indexes,
      defaultValues,
    };

    //console.log(inspect(this.facts, false, 5, true));
  }

  getTables(filters: string[] = []): string[] {
    return this.facts.tables.filter(table => {
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

  getTablePrimaryKeys(table: string): string[] {
    return this.facts.compositePrimaryKeys.hasOwnProperty(table)
      ? this.facts.compositePrimaryKeys[table]
      : [];
  }

  getTableUniques(table: string): IBlueprint['uniques'] {
    return this.facts.uniques.hasOwnProperty(table)
      ? this.facts.uniques[table]
      : {};
  }

  getTableIndexes(table: string): IBlueprint['indexes'] {
    return this.facts.indexes.hasOwnProperty(table)
      ? this.facts.indexes[table]
      : {};
  }

  getTableDefaultValues(table: string): {
    [columnName: string]: IColumn['defaultValue'];
  } {
    return this.facts.defaultValues.hasOwnProperty(table)
      ? this.facts.defaultValues[table]
      : {};
  }

  async findEnumeratorColumns(
    table: string,
    columns: Column[],
  ): Promise<{ column: string; values: string[] }[]> {
    return this.factSource.findEnumeratorColumns(table, columns);
  }

  getTableForeignKeys(table: string): IBlueprint['relations'] {
    return this.facts.relations.hasOwnProperty(table)
      ? this.facts.relations[table]
      : {};
  }

  addTableForeignKey(table: string, name: string, definition: IRelation): void {
    if (!this.facts.relations.hasOwnProperty(table)) {
      this.facts.relations[table] = {};
    }

    this.facts.relations[table][name] = definition;
  }

  async getTableColumns(table: string): Promise<Column[]> {
    return this.factSource.columnInfo(table);
  }

  isTableExists(table: string): boolean {
    return this.facts.tables.includes(table);
  }

  isUniqueConstraintExists(constraint: string): boolean {
    return this.facts.uniqueConstraints.includes(constraint);
  }
}
