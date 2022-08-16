import { Knex } from 'knex';
import { Logger } from 'pino';
import { BlueprintKind, IBlueprint } from '../blueprint';
import { FactReader } from '../fact/fact.reader';
import { IFactCollector } from '../fact/types';

import { MigrationPlan } from './migration.plan';
import { MigrationPlanner } from './migration.planner';
import { IMigrationContext } from './types/migration-context.interface';
import { IMigrationManager } from './types/migration-manager.interface';
import { IMigrationPlan } from './types/migration-plan.interface';

// Calculates and applies the changes on the database
export class MigratonManager implements IMigrationManager {
  constructor(
    readonly logger: Logger,
    protected knex: Knex,
    readonly facts: IFactCollector,
  ) {}

  /**
   * Read the database state and return it as a list of blueprints.
   */
  async reverse(filters: string[] = []): Promise<IBlueprint[]> {
    const blueprints = [];

    await this.facts.gather();
    const reader = new FactReader(this.facts);

    for (const table of this.facts.getTables(filters)) {
      blueprints.push(reader.reverse(table));
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
    const planner = new MigrationPlanner(ctx);

    await Promise.all(
      blueprints.map(blueprint => {
        if (blueprint.kind === BlueprintKind.TABLE) {
          // If the table doesn't exist, create it
          if (!this.facts.isTableExists(blueprint.tableName)) {
            return planner.createTable(blueprint);
          }
          // If the table exists, compare the state and apply the alterations
          else {
            return planner.alterTable(blueprint);
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
