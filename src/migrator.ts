import { Knex } from 'knex';
import { Inspector } from './inspector';
import { IBlueprint } from './interface/blueprint.interface';

// Calculates and applies the changes on the database
export class Migrator {
  /**
   * The connection to inspect
   */
  readonly inspector: Inspector;

  constructor(protected knex: Knex) {
    this.inspector = new Inspector(knex);
  }

  /**
   * Reads the connection's database into a set of structure, and update it to match the blueprints
   */
  async apply(blueprints: IBlueprint[]) {
    const tables = await this.inspector.tables();
    const queries: Knex.SchemaBuilder[] = [];

    blueprints.forEach(blueprint => {
      if (blueprint.kind === 'table') {
        if (!tables.includes(blueprint.id)) {
          queries.push(this.createTable(blueprint));
        }
      }
    });

    await Promise.all(queries);
  }

  protected createTable(blueprint: IBlueprint) {
    return this.knex.schema.createTable(blueprint.id, () => {});
  }
}
