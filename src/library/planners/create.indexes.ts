import { IMigrationContext } from '../../types/migration-context.interface';
import { MigrationRisk } from '../../types/migration-risk.enum';
import { ITable } from '../../types/table.interface';

export const createIndexes = (table: ITable, ctx: IMigrationContext) => {
  // Apply the composite indexes
  for (const indexName in table.indexes) {
    if (Object.prototype.hasOwnProperty.call(table.indexes, indexName)) {
      const createIndexQuery = ctx.knex.schema.alterTable(table.name, builder =>
        builder.index(
          table.indexes[indexName].columns,
          indexName,
          table.indexes[indexName].type,
        ),
      );

      ctx.plan.steps.push({
        query: createIndexQuery,
        risk: MigrationRisk.LOW,
        description: `Create composite index [${indexName}] for table [${table.name}]`,
        phase: 2,
      });
    }
  }
};
