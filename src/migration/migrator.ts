import { Knex } from 'knex';
import { Logger } from 'pino';
import { IReflection } from '../reflection/types';
import { ITable } from '../table';
import { MigrationPlan } from './migration.plan';
import { MigrationPlanner } from './migration.planner';
import { IMigrationContext } from './types/migration-context.interface';
import { IMigrationPlan } from './types/migration-plan.interface';

// Calculates and applies the changes on the database
export class Migrator {
  constructor(
    protected logger: Logger,
    protected knex: Knex,
    protected reflection: IReflection,
  ) {}

  /**
   * Read the database state and return it as a list of tables.
   */
  async readDatabaseState(filters: string[] = []): Promise<ITable[]> {
    const tables = [];
    await this.reflection.updateFacts();

    for (const table of this.reflection.getTables(filters)) {
      tables.push(this.reflection.getTableState(table));
    }

    return tables;
  }

  async compareDatabaseState(tables: ITable[]): Promise<IMigrationPlan> {
    const ctx: IMigrationContext = {
      knex: this.knex,
      reflection: this.reflection,
      plan: new MigrationPlan(this.logger),
    };

    await this.reflection.updateFacts();
    const planner = new MigrationPlanner(ctx);

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

  async dropTableDescriptor(table: ITable): Promise<void> {
    await this.dropTable(table.name);
  }

  async dropTable(tableName: string): Promise<void> {
    await this.knex.schema.dropTableIfExists(tableName);
  }
}
