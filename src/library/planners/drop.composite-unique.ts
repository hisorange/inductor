import { IChange } from '../../types/change.interface';
import { MigrationRisk } from '../../types/migration-risk.enum';

export const dropCompositeUnique = (
  { context: ctx, current, target }: IChange,
  uniqueName: string,
) => {
  ctx.plan.steps.push({
    query: ctx.knex.schema.alterTable(target.name, builder =>
      builder.dropUnique(current.uniques![uniqueName].columns, uniqueName),
    ),
    risk: MigrationRisk.LOW,
    description: `Dropping composite unique ${uniqueName}`,
    phase: 3,
  });
};
