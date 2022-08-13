import { Knex } from 'knex';
import { Logger } from 'pino';
import { MigrationPlan } from '../../component/migration.plan';
import { IBlueprint } from '../../interface/blueprint/blueprint.interface';
import { BlueprintKind } from '../../interface/blueprint/blueprint.kind';
import { IFactCollector } from '../../interface/fact/fact-collector.interface';
import { IMigrationContext } from '../../interface/migration/migration-ctx.interface';
import { IMigrationPlan } from '../../interface/migration/migration-plan.interface';
import { IMigrator } from '../../interface/migrator.interface';
import { alterTable } from './migrator/alter.table';
import { tableCreator } from './migrator/creator/table.creator';
import { reverseTable } from './migrator/reverse.table';

// Calculates and applies the changes on the database
export class PostgresMigrator implements IMigrator {
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

    for (const table of this.facts.getTables(filters)) {
      const blueprint = await reverseTable(this.facts, table);

      blueprints.push(blueprint);
    }

    return blueprints;
  }

  async compare(blueprints: IBlueprint[]): Promise<IMigrationPlan> {
    const plan = new MigrationPlan(this.logger);
    await this.facts.gather();

    const ctx: IMigrationContext = {
      knex: this.knex,
      facts: this.facts,
      plan: plan,
    };

    for (const targetState of blueprints) {
      this.logger.debug('Processing blueprint %s', targetState.tableName);

      if (targetState.kind === BlueprintKind.TABLE) {
        // If the table doesn't exist, create it
        if (!this.facts.isTableExists(targetState.tableName)) {
          await tableCreator(targetState, ctx);
        }
        // If the table exists, compare the state and apply the alterations
        else {
          const currentState = await reverseTable(
            this.facts,
            targetState.tableName,
          );

          await alterTable(ctx, currentState, targetState);
        }
      }
    }

    return plan;
  }

  /**
   * Reads the connection's database into a set of structure, and update it to match the blueprints
   */
  async migrate(blueprints: IBlueprint[]): Promise<void> {
    const changePlan = await this.compare(blueprints);
    await changePlan.execute();
  }

  async dropBlueprint(blueprint: IBlueprint): Promise<void> {
    await this.dropTable(blueprint.tableName);
  }

  async dropTable(tableName: string): Promise<void> {
    await this.knex.schema.dropTableIfExists(tableName);
  }
}
