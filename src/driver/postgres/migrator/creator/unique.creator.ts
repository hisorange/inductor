import { IBlueprint } from '../../../../interface/blueprint/blueprint.interface';
import { IMigrationContext } from '../../../../interface/migration/migration-ctx.interface';
import { MigrationRisk } from '../../../../interface/migration/migration.risk';

export const uniqueCreator = async (
  blueprint: IBlueprint,
  ctx: IMigrationContext,
) => {
  // Apply the composite unique constraints
  for (const uniqueName in blueprint.uniques) {
    if (Object.prototype.hasOwnProperty.call(blueprint.uniques, uniqueName)) {
      if (ctx.facts.isUniqueConstraintExists(uniqueName)) {
        throw new Error(
          `Unique constraint [${uniqueName}] for [${blueprint.tableName}] already exists`,
        );
      }

      const createUniqueQuery = ctx.knex.schema.alterTable(
        blueprint.tableName,
        builder =>
          builder.unique(blueprint.uniques[uniqueName].columns, {
            indexName: uniqueName,
          }),
      );

      ctx.plan.steps.push({
        query: createUniqueQuery,
        risk: MigrationRisk.NONE,
        description: `Create composite unique [${uniqueName}] for table [${blueprint.tableName}]`,
        phase: 2,
      });

      // Track to avoid duplicates in the same migration context.
      ctx.facts.addUnique(uniqueName);
    }
  }
};
