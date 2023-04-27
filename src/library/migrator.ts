import knex, { Knex } from 'knex';
import cloneDeep from 'lodash.clonedeep';
import pino, { Logger } from 'pino';
import { defaultMetaExtensions } from '../meta/default.metas';
import { IConfig } from '../types/config.interface';
import { IDatabase } from '../types/database.interface';
import { IMigrationContext } from '../types/migration-context.interface';
import { Plan } from './plan';
import { Planner } from './planner';
import { Reflection } from './reflection';
import { readDatabase } from './reflectors/database.reader';

// Calculates and applies the changes on the database
export class Migrator {
  readonly logger: Logger;
  readonly connection: Knex;

  constructor(
    sessionId: string,
    readonly config: IConfig,
    readonly database: IDatabase,
  ) {
    if (!this.config.metas) {
      this.config.metas = [];
    }

    defaultMetaExtensions.forEach(meta => this.config.metas!.push(meta));

    if (typeof this.config.connection === 'function') {
      this.connection = this.config.connection;
    } else {
      this.connection = knex({
        client: 'pg',
        connection: {
          ...config.connection,
          application_name: `inductor.${sessionId}`,
        },
        pool: {
          max: 50,
          min: 0,
          idleTimeoutMillis: 5_000,
        },
      });
    }

    this.logger = pino({
      name: `inductor.${sessionId}`,
      level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
      enabled: process.env.NODE_ENV !== 'test',
    });
  }

  protected async reflect(): Promise<Reflection> {
    return new Reflection(
      this.connection,
      await readDatabase(this.connection, this.config.metas!),
      this.config.metas!,
    );
  }

  /**
   * Read the database state and return it as a list of tables.
   */
  async read(filters: string[] = []): Promise<IDatabase> {
    const reflection = await this.reflect();
    const state = cloneDeep(this.database);
    state.tables = reflection
      .getTables(filters)
      .map(table => reflection.getTableState(table));

    return state;
  }

  async compare(state: IDatabase): Promise<Plan> {
    const reflection = await this.reflect();
    const ctx: IMigrationContext = {
      knex: this.connection,
      reflection: reflection,
      plan: new Plan(this.logger),
      metas: this.config.metas!,
    };

    const planner = new Planner(ctx);

    await Promise.all(
      state.tables.map(table => {
        // If the table doesn't exist, create it
        if (!reflection.isTableExists(table.name)) {
          return planner.createTable(table);
        }
        // If the table exists, compare the state and apply the alterations
        else {
          return planner.alterTable(table);
        }
      }),
    );

    return ctx.plan;
  }

  async drop(tableName: string): Promise<void> {
    await this.connection.schema.dropTableIfExists(tableName);
  }
}
