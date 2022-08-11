import { IMigrationContext } from '../../../../interface/migration/migration-ctx.interface';
import { MigrationRisk } from '../../../../interface/migration/migration.risk';
import { ISchema } from '../../../../interface/schema/schema.interface';

export const uniqueCreator = async (
  schema: ISchema,
  ctx: IMigrationContext,
) => {
  // Apply the compositive unique constraints
  for (const uniqueName in schema.uniques) {
    if (Object.prototype.hasOwnProperty.call(schema.uniques, uniqueName)) {
      if (ctx.facts.isUniqueConstraintExists(uniqueName)) {
        throw new Error(
          `Unique constraint [${uniqueName}] for [${schema.tableName}] already exists`,
        );
      }

      const createUniqueQuery = ctx.knex.schema.alterTable(
        schema.tableName,
        builder =>
          builder.unique(schema.uniques[uniqueName].columns, {
            indexName: uniqueName,
          }),
      );

      ctx.plan.steps.push({
        query: createUniqueQuery,
        risk: MigrationRisk.NONE,
        description: `Create compositive unique [${uniqueName}] for table [${schema.tableName}]`,
      });

      // Track to avoid duplicates in the same migration context.
      ctx.facts.addNewUniqueConstraint(uniqueName);
    }
  }
};
