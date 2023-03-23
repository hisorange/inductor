import { ChangeContext } from '../../types/change-context.interface';
import { IColumn } from '../../types/column.interface';
import { MigrationRisk } from '../../types/migration-risk.enum';

export const alterUnique = (
  { ctx, target }: ChangeContext,
  columnName: string,
  columnDefinition: IColumn,
) => {
  ctx.plan.steps.push({
    query: ctx.knex.schema.alterTable(target.name, builder => {
      if (columnDefinition.isUnique) {
        builder.unique([columnName]);
      } else {
        builder.dropUnique([columnName]);
      }
    }),
    risk: MigrationRisk.LOW,
    description: `Changing column ${columnName} unique state`,
    phase: 3,
  });
};
