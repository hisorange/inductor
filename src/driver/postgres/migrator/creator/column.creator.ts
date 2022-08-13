import { ColumnTools } from '../../../../component/column-tools';
import { IBlueprint } from '../../../../interface/blueprint/blueprint.interface';
import { IMigrationContext } from '../../../../interface/migration/migration-ctx.interface';
import { MigrationRisk } from '../../../../interface/migration/migration.risk';
import { createColumn } from '../create.column';

export const columnCreator = async (
  blueprint: IBlueprint,
  ctx: IMigrationContext,
) => {
  if (Object.keys(blueprint.columns).length) {
    const createColumnsQuery = ctx.knex.schema.alterTable(
      blueprint.tableName,
      builder => {
        for (const name in blueprint.columns) {
          if (Object.prototype.hasOwnProperty.call(blueprint.columns, name)) {
            createColumn(
              builder,
              name,
              blueprint.columns[name],
              blueprint,
              ctx.facts,
            );
          }
        }

        const primaries = ColumnTools.filterPrimary(blueprint);

        if (primaries.length > 1) {
          builder.primary(primaries);
        }
      },
    );

    ctx.plan.steps.push({
      query: createColumnsQuery,
      risk: MigrationRisk.NONE,
      description: `Create columns for table [${blueprint.tableName}]`,
      phase: 1,
    });
  }
};
