import { ChangeContext } from '../../types/change-context.interface';
import { MigrationRisk } from '../../types/migration-risk.enum';

export const dropCompositeUnique = (
  { ctx, current, target }: ChangeContext,
  uniqueName: string,
) => {
  ctx.plan.steps.push({
    query: ctx.knex.schema.alterTable(target.name, builder =>
      builder.dropUnique(current.uniques[uniqueName].columns, uniqueName),
    ),
    risk: MigrationRisk.LOW,
    description: `Dropping composite unique ${uniqueName}`,
    phase: 3,
  });
};
