import { IChange } from '../../types/change.interface';
import { IColumn } from '../../types/column.interface';
import { MigrationRisk } from '../../types/migration-risk.enum';
import { createColumn } from './column.creator';

export const addColumn = async (
  { context: ctx, target }: IChange,
  cname: string,
  def: IColumn,
) => {
  let risk = MigrationRisk.NONE;

  // Check if the column has a default value
  // If not then we have to check for rows
  // as creating a new column without default would make the step impossible
  if (typeof def.defaultValue === 'undefined') {
    if (await ctx.reflection.isTableHasRows(target.name)) {
      risk = MigrationRisk.IMPOSSIBLE;
    }
  }

  ctx.plan.steps.push({
    query: ctx.knex.schema.alterTable(target.name, builder =>
      createColumn(
        builder,
        cname,
        target.columns[cname],
        target,
        ctx.reflection,
      ),
    ),
    risk,
    description: `Creating new column ${cname}`,
    phase: 3,
  });
};
