import { IChange } from '../../types/change.interface';
import { MigrationRisk } from '../../types/migration-risk.enum';
import { ColumnTools } from '../../utils/column-tools';

export const alterPrimaryKeys = (
  { current, target, context: ctx }: IChange,
  {
    isPrimaryCreated,
    isPrimaryDropped,
  }: {
    isPrimaryCreated: boolean;
    isPrimaryDropped: boolean;
  },
) => {
  const currentPrimaries = ColumnTools.filterPrimary(current);
  const expectedPrimaries = ColumnTools.filterPrimary(target);

  // Remove the current primary keys
  if (currentPrimaries.length > 0) {
    // By default, it's easier to drop the primary keys
    // But some exceptions are handled here
    let shouldDropPrimary = true;

    // Except when the primary was a single key and the column was dropped
    // In this case the primary is cascades with the dropped column
    if (currentPrimaries.length === 1 && expectedPrimaries.length === 0) {
      if (isPrimaryDropped) {
        shouldDropPrimary = false;
      }
    }

    if (shouldDropPrimary) {
      ctx.plan.steps.push({
        query: ctx.knex.schema.alterTable(target.name, builder =>
          builder.dropPrimary(),
        ),
        risk: MigrationRisk.LOW,
        description: `Dropping primary for ${target.name}`,
        phase: 3,
      });
    }
  }

  // Add the new primary keys
  if (expectedPrimaries.length > 0) {
    let shouldAddCompositePrimary = true;

    // Except when we add the first primary, and the column is created with the create column call
    if (currentPrimaries.length === 0 && expectedPrimaries.length === 1) {
      if (isPrimaryCreated) {
        shouldAddCompositePrimary = false;
      }
    }

    if (shouldAddCompositePrimary) {
      ctx.plan.steps.push({
        query: ctx.knex.schema.alterTable(target.name, builder =>
          builder.primary(expectedPrimaries),
        ),
        risk: MigrationRisk.LOW,
        description: `Creating primary for ${target.name}`,
        phase: 3,
      });
    }
  }
};
