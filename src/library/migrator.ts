import knex, { Knex } from 'knex';
import pino, { Logger } from 'pino';
import { IDatabase } from '../types/database.interface';
import { IMigrationContext } from '../types/migration-context.interface';
import { ITable } from '../types/table.interface';
import { Plan } from './plan';
import { Planner } from './planner';
import { Reflection } from './reflection';

// Calculates and applies the changes on the database
export class Migrator {
  readonly reflection: Reflection;
  readonly logger: Logger;
  readonly knex: Knex;

  constructor(sessionId: string, database: IDatabase) {
    const connection = database.connection;
    connection.application_name = `inductor.${sessionId}`;

    this.knex = knex({
      client: 'pg',
      connection,
      pool: {
        max: 50,
        min: 0,
        idleTimeoutMillis: 5_000,
      },
    });

    this.logger = pino({
      name: `inductor.${sessionId}`,
      level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
      enabled: process.env.NODE_ENV !== 'test',
    });

    this.reflection = new Reflection(this.knex);
  }

  /**
   * Read the database state and return it as a list of tables.
   */
  async readDatabaseState(filters: string[] = []): Promise<ITable[]> {
    const tables = [];
    await this.reflection.refresh();

    for (const table of this.reflection.getTables(filters)) {
      tables.push(this.reflection.getTableState(table));
    }

    return tables;
  }

  async compareDatabaseState(tables: ITable[]): Promise<Plan> {
    const ctx: IMigrationContext = {
      knex: this.knex,
      reflection: this.reflection,
      plan: new Plan(this.logger),
    };

    await this.reflection.refresh();
    const planner = new Planner(ctx);

    await Promise.all(
      tables.map(table => {
        // If the table doesn't exist, create it
        if (!this.reflection.isTableExists(table.name)) {
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

  async dropTable(tableName: string): Promise<void> {
    await this.knex.schema.dropTableIfExists(tableName);

    if (!this.reflection.isTableExists(tableName)) {
      this.reflection.removeTable(tableName);
    }
  }
}
