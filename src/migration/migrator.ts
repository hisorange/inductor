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
   * Read the database state and return it as a list of blueprints.
   */
  async readDatabaseState(filters: string[] = []): Promise<ISchema[]> {
    const blueprints = [];
    await this.factManager.updateFacts();

    for (const table of this.factManager.getTables(filters)) {
      blueprints.push(this.factManager.getBlueprintForTable(table));
    }

    return blueprints;
  }

  async compareDatabaseState(blueprints: ISchema[]): Promise<IMigrationPlan> {
    const ctx: IMigrationContext = {
      knex: this.knex,
      factManager: this.factManager,
      migrationPlan: new MigrationPlan(this.logger),
    };

    await this.factManager.updateFacts();
    const planner = new MigrationPlanner(ctx);

    await Promise.all(
      blueprints.map(blueprint => {
        if (blueprint.kind === SchemaKind.TABLE) {
          // If the table doesn't exist, create it
          if (!this.factManager.isTableExists(blueprint.tableName)) {
            return planner.createTable(blueprint);
          }
          // If the table exists, compare the state and apply the alterations
          else {
            return planner.alterTable(blueprint);
          }
        }
      }),
    );

    return ctx.migrationPlan;
  }

  async dropBlueprint(blueprint: ISchema): Promise<void> {
    await this.dropTable(blueprint.tableName);
  }

  async dropTable(tableName: string): Promise<void> {
    await this.knex.schema.dropTableIfExists(tableName);
  }
}
