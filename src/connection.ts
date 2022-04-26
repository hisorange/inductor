import knex, { Knex } from 'knex';
import { IBlueprint } from './interface/blueprint.interface';
import { Migrator } from './migrator';

/**
 * This class manages the connection and keeps the state
 */
export class Connection {
  /**
   * Store the Knex instance
   */
  readonly knex: Knex;

  /**
   * Store the migrator instance
   */
  readonly migrator: Migrator;

  /**
   * Associated blueprint with the connection
   */
  protected blueprints: IBlueprint[] = [];

  /**
   * Create a new connection
   */
  constructor(
    protected config: {
      connection: Knex.PgConnectionConfig;
      access: 'read' | 'write';
    },
  ) {
    this.knex = knex({
      client: 'pg',
      connection: this.config.connection,
    });

    this.migrator = new Migrator(this.knex);
  }

  /**
   * Associate a blueprint with the connection
   */
  async associate(blueprint: IBlueprint) {
    // Check if the blueprint is already associated
    if (this.blueprints.find(b => b.id === blueprint.id)) {
      throw new Error(`Blueprint ${blueprint.id} is already associated`);
    }

    this.blueprints.push(blueprint);
    await this.migrator.apply(this.blueprints);
  }

  close() {
    return this.knex.destroy();
  }
}
