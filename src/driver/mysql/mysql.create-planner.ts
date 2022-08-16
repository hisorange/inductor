import { ColumnTools } from '../../component/column-tools';
import { IBlueprint, MigrationRisk } from '../../interface';
import { SQLBaseCreatePlanner } from '../abstract/base.create-planner';

export class MySQLCreatePlanner extends SQLBaseCreatePlanner {
  async createTable(blueprint: IBlueprint): Promise<void> {
    this.ctx.plan.steps.push({
      query: this.ctx.knex.schema.createTable(blueprint.tableName, builder => {
        for (const name in blueprint.columns) {
          if (Object.prototype.hasOwnProperty.call(blueprint.columns, name)) {
            const definition = blueprint.columns[name];
            builder.specificType(name, definition.type.name);
          }
        }

        const primaries = ColumnTools.filterPrimary(blueprint);

        if (primaries.length > 1) {
          builder.primary(primaries);
        }
      }),
      risk: MigrationRisk.NONE,
      description: `Create table [${blueprint.tableName}] with columns`,
      phase: 0,
    });

    // Register the fact that the table exits
    this.ctx.facts.addTable(blueprint.tableName);
  }
}
