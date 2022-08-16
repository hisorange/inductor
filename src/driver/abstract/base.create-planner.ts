import { IBlueprint, IMigrationContext, MigrationRisk } from '../../interface';
import { ICreatePlanner } from '../../interface/migration/create-planner.interface';

export abstract class SQLBaseCreatePlanner implements ICreatePlanner {
  constructor(readonly ctx: IMigrationContext) {}
  abstract createTable(blueprint: IBlueprint): Promise<void>;

  async _createTable(blueprint: IBlueprint): Promise<void> {
    this.ctx.plan.steps.push({
      query: this.ctx.knex.schema.createTable(blueprint.tableName, () => {}),
      risk: MigrationRisk.NONE,
      description: `Create table [${blueprint.tableName}]`,
      phase: 0,
    });

    // Register the fact that the table exits
    this.ctx.facts.addTable(blueprint.tableName);
  }
}
