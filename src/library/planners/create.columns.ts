import { IMigrationContext } from '../../types/migration-context.interface';
import { MigrationRisk } from '../../types/migration-risk.enum';
import { ITable } from '../../types/table.interface';
import { ColumnTools } from '../../utils/column-tools';
import { createColumn } from './column.creator';

export const createColumns = (table: ITable, ctx: IMigrationContext) => {
  if (Object.keys(table.columns).length) {
    const createColumnsQuery = ctx.knex.schema.alterTable(
      table.name,
      builder => {
        for (const name in table.columns) {
          if (Object.prototype.hasOwnProperty.call(table.columns, name)) {
            createColumn(
              builder,
              name,
              table.columns[name],
              table,
              ctx.reflection,
            );
          }
        }

        const primaries = ColumnTools.filterPrimary(table);

        if (primaries.length > 1) {
          builder.primary(primaries);
        }
      },
    );

    ctx.plan.steps.push({
      query: createColumnsQuery,
      risk: MigrationRisk.NONE,
      description: `Create columns for table [${table.name}]`,
      phase: 1,
    });
  }
};
