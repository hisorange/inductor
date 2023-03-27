import { IChange } from '../../types/change.interface';
import { MigrationRisk } from '../../types/migration-risk.enum';

export const dropColumn = (
  { context: ctx, target }: IChange,
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
