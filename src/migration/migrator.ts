import { Knex } from 'knex';
import { Logger } from 'pino';
import { IReflection } from '../reflection/types';
import { ISchema, SchemaKind } from '../schema';
import { MigrationPlan } from './migration.plan';
import { MigrationPlanner } from './migration.planner';
import { IMigrationContext } from './types/migration-context.interface';
import { IMigrationPlan } from './types/migration-plan.interface';

// Calculates and applies the changes on the database
export class Migrator {
  constructor(
    protected logger: Logger,
    protected knex: Knex,
    protected factManager: IReflection,
  ) {}

  /**
   * Read the database state and return it as a list of schemas.
   */
  async readDatabaseState(filters: string[] = []): Promise<ISchema[]> {
    const schemas = [];
    await this.factManager.updateFacts();

    for (const table of this.factManager.getTables(filters)) {
      schemas.push(this.factManager.getSchemaForTable(table));
    }

    return schemas;
  }

  async compareDatabaseState(schemas: ISchema[]): Promise<IMigrationPlan> {
    const ctx: IMigrationContext = {
      knex: this.knex,
      factManager: this.factManager,
      migrationPlan: new MigrationPlan(this.logger),
    };

    await this.factManager.updateFacts();
    const planner = new MigrationPlanner(ctx);

    await Promise.all(
      schemas.map(schema => {
        if (schema.kind === SchemaKind.TABLE) {
          // If the table doesn't exist, create it
          if (!this.factManager.isTableExists(schema.tableName)) {
            return planner.createTable(schema);
          }
          // If the table exists, compare the state and apply the alterations
          else {
            return planner.alterTable(schema);
          }
        }
      }),
    );

    return ctx.migrationPlan;
  }

  async dropSchema(schema: ISchema): Promise<void> {
    await this.dropTable(schema.tableName);
  }

  async dropTable(tableName: string): Promise<void> {
    await this.knex.schema.dropTableIfExists(tableName);
  }
}
