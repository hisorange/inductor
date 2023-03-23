import { ChangeContext } from '../../types/change-context.interface';
import { MigrationRisk } from '../../types/migration-risk.enum';

export const dropColumn = (
  { ctx, target }: ChangeContext,
  columnName: string,
) => {
  ctx.plan.steps.push({
    query: ctx.knex.schema.alterTable(target.name, builder =>
      builder.dropColumn(columnName),
    ),
    risk: MigrationRisk.LOW,
    description: `Dropping column ${columnName}`,
    phase: 3,
  });
};
