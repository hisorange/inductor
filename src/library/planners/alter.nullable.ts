import { IChange } from '../../types/change.interface';
import { IColumn } from '../../types/column.interface';
import { MigrationRisk } from '../../types/migration-risk.enum';

export const alterNullable = (
  { context: ctx, target }: IChange,
  columnName: string,
  columnDefinition: IColumn,
) => {
  ctx.plan.steps.push({
    query: ctx.knex.schema.alterTable(target.name, builder => {
      if (columnDefinition.isNullable) {
        builder.setNullable(columnName);
      } else {
        builder.dropNullable(columnName);
      }
    }),
    risk: MigrationRisk.LOW,
    description: `Changing column ${columnName} nullable state`,
    phase: 3,
  });
};
