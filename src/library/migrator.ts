import knex, { Knex } from 'knex';
import pino, { Logger } from 'pino';
import { ColumnAliasMeta } from '../meta/column-alias.meta';
import { ColumnCapMeta } from '../meta/column-cap.meta';
import { ColumnHookMeta } from '../meta/column-hook.meta';
import { TableAliasMeta } from '../meta/table-alias.meta';
import { IDatabase } from '../types/database.interface';
import { IMeta } from '../types/meta.interface';
import { IMigrationContext } from '../types/migration-context.interface';
import { ITable } from '../types/table.interface';
import { Plan } from './plan';
import { Planner } from './planner';
import { Reflection } from './reflection';
import { readDatabase } from './reflectors/database.reader';

// Calculates and applies the changes on the database
export class Migrator {
  readonly logger: Logger;
  readonly connection: Knex;
  readonly meta: IMeta[] = [
    ColumnAliasMeta,
    ColumnCapMeta,
    ColumnHookMeta,
    TableAliasMeta,
  ];

  constructor(sessionId: string, readonly database: IDatabase) {
    database?.metax?.forEach(meta => this.meta.push(meta));

    this.connection = knex({
      client: 'pg',
      connection: {
        ...database.connection,
        application_name: `inductor.${sessionId}`,
      },
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
  }

  protected async reflect(): Promise<Reflection> {
    return new Reflection(
      this.connection,
      await readDatabase(this.connection),
      this.meta,
    );
  }

  /**
   * Read the database state and return it as a list of tables.
   */
  async read(filters: string[] = []): Promise<ITable[]> {
    const reflection = await this.reflect();

    return reflection
      .getTables(filters)
      .map(table => reflection.getTableState(table));
  }

  async compare(tables: ITable[]): Promise<Plan> {
    const reflection = await this.reflect();
    const ctx: IMigrationContext = {
      knex: this.connection,
      reflection: reflection,
      plan: new Plan(this.logger),
      metas: this.meta,
    };

    const planner = new Planner(ctx);

    await Promise.all(
      tables.map(table => {
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
