import { IChange } from '../../types/change.interface';
import { MigrationRisk } from '../../types/migration-risk.enum';

export const addCompositeUnique = (
  { current, target, context: ctx }: IChange,
  uniqueName: string,
) => {
  // We have to check if the unique existed before
  // because the add is only applied to the columns
  if (current.uniques[uniqueName]) {
    ctx.plan.steps.push({
      query: ctx.knex.schema.alterTable(target.name, builder =>
        builder.dropUnique(current.uniques[uniqueName].columns, uniqueName),
      ),
      risk: MigrationRisk.LOW,
      description: `Dropping unique ${uniqueName} before recreation`,
      phase: 3,
    });
  }

  ctx.plan.steps.push({
    query: ctx.knex.schema.alterTable(target.name, builder =>
      builder.unique(target.uniques[uniqueName].columns, {
        indexName: uniqueName,
      }),
    ),
    risk: MigrationRisk.LOW,
    description: `Creating composite unique ${uniqueName}`,
    phase: 3,
  });
};
