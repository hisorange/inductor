import { IChange } from '../../types/change.interface';
import { IColumn } from '../../types/column.interface';
import { MigrationRisk } from '../../types/migration-risk.enum';

export const alterUnique = (
  { context: ctx, target }: IChange,
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
