import { IBlueprint } from '../../../../interface/blueprint/blueprint.interface';
import { IMigrationContext } from '../../../../interface/migration/migration-ctx.interface';
import { MigrationRisk } from '../../../../interface/migration/migration.risk';

export const indexCreator = async (
  blueprint: IBlueprint,
  ctx: IMigrationContext,
) => {
  // Apply the composite indexes
  for (const indexName in blueprint.indexes) {
    if (Object.prototype.hasOwnProperty.call(blueprint.indexes, indexName)) {
      const createIndexQuery = ctx.knex.schema.alterTable(
        blueprint.tableName,
        builder =>
          builder.index(
            blueprint.indexes[indexName].columns,
            indexName,
            blueprint.indexes[indexName].type,
          ),
      );

      ctx.plan.steps.push({
        query: createIndexQuery,
        risk: MigrationRisk.LOW,
        description: `Create composite index [${indexName}] for table [${blueprint.tableName}]`,
        phase: 2,
      });
    }
  }
};
