import { Knex } from 'knex';
import { Logger } from 'pino';
import { MigrationPlan } from '../component/migration.plan';
import {
  BlueprintKind,
  IBlueprint,
  IFactCollector,
  IMigrationContext,
  IMigrationPlan,
  IMigrator,
} from '../interface';
import { IAlterPlanner } from '../interface/migration/alter-planner.interface';
import { ICreatePlanner } from '../interface/migration/create-planner.interface';
import { IStateReader } from '../interface/state-reader.interface';

export abstract class BaseMigrator implements IMigrator {
  constructor(
    readonly logger: Logger,
    protected knex: Knex,
    readonly facts: IFactCollector,
  ) {}

  abstract createStateReader(): IStateReader;
  abstract createCreatePlanner(ctx: IMigrationContext): ICreatePlanner;
  abstract createAlterPlanner(ctx: IMigrationContext): IAlterPlanner;

  /**
   * Read the database state and return it as a list of blueprints.
   */
  async reverse(filters: string[] = []): Promise<IBlueprint[]> {
    const blueprints = [];

    await this.facts.gather();
    const reader = this.createStateReader();

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
    const creator = this.createCreatePlanner(ctx);
    const alterer = this.createAlterPlanner(ctx);

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
