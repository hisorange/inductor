import { IMigrationContext } from '../../types/migration-context.interface';
import { MigrationRisk } from '../../types/migration-risk.enum';
import { ITable } from '../../types/table.interface';

export const createUniques = (table: ITable, ctx: IMigrationContext) => {
  if (table.uniques && Object.keys(table.uniques).length > 0) {
    // Apply the composite unique constraints
    for (const uniqueName in table.uniques) {
      if (Object.prototype.hasOwnProperty.call(table.uniques, uniqueName)) {
        if (ctx.reflection.isUniqueConstraintExists(uniqueName)) {
          throw new Error(
            `Unique constraint [${uniqueName}] for [${table.name}] already exists`,
          );
        }

        const createUniqueQuery = ctx.knex.schema.alterTable(
          table.name,
          builder =>
            builder.unique(table.uniques![uniqueName].columns, {
              indexName: uniqueName,
            }),
        );

        ctx.plan.steps.push({
          query: createUniqueQuery,
          risk: MigrationRisk.NONE,
          description: `Create composite unique [${uniqueName}] for table [${table.name}]`,
          phase: 2,
        });

        // Track to avoid duplicates in the same migration context.
        ctx.reflection.addUnique(uniqueName);
      }
    }
  }
};
