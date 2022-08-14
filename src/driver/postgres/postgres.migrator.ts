import { Knex } from 'knex';
import { Logger } from 'pino';
import { MigrationPlan } from '../../component/migration.plan';
import { IBlueprint } from '../../interface/blueprint/blueprint.interface';
import { BlueprintKind } from '../../interface/blueprint/blueprint.kind';
import { IFactCollector } from '../../interface/fact/fact-collector.interface';
import { IMigrationContext } from '../../interface/migration/migration-ctx.interface';
import { IMigrationPlan } from '../../interface/migration/migration-plan.interface';
import { IMigrator } from '../../interface/migrator.interface';
import { PostgresAlterPlanner } from './migrator/alter.planner';
import { PostgresCreatePlanner } from './migrator/create.planner';
import { PostgresStateReader } from './state.reader';

// Calculates and applies the changes on the database
export class PostgresMigrationPlanner implements IMigrator {
  constructor(
    readonly logger: Logger,
    protected knex: Knex,
    protected facts: IFactCollector,
  ) {}

  /**
   * Read the database state and return it as a list of blueprints.
   */
  async reverse(filters: string[] = []): Promise<IBlueprint[]> {
    const blueprints = [];

    await this.facts.gather();
    const reader = new PostgresStateReader(this.facts);

    for (const table of this.facts.getTables(filters)) {
      blueprints.push(await reader.reverse(table));
    }

    return blueprints;
  }

  async compare(blueprints: IBlueprint[]): Promise<IMigrationPlan> {
    const ctx: IMigrationContext = {
      knex: this.knex,
      facts: this.facts,
      plan: new MigrationPlan(this.logger),
    };

    await this.facts.gather();
    const creator = new PostgresCreatePlanner(ctx);
    const alterer = new PostgresAlterPlanner(ctx);

    await Promise.all(
      blueprints.map(blueprint => {
        if (blueprint.kind === BlueprintKind.TABLE) {
          // If the table doesn't exist, create it
          if (!this.facts.isTableExists(blueprint.tableName)) {
            return creator.createTable(blueprint);
          }
          // If the table exists, compare the state and apply the alterations
          else {
            return alterer.alterTable(blueprint);
          }
        }
      }),
    );

    return ctx.plan;
  }

  async dropBlueprint(blueprint: IBlueprint): Promise<void> {
    await this.dropTable(blueprint.tableName);
  }

  async dropTable(tableName: string): Promise<void> {
    await this.knex.schema.dropTableIfExists(tableName);
  }
}
