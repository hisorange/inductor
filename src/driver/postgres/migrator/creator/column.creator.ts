import { ColumnTools } from '../../../../column-tools';
import { IMigrationContext } from '../../../../interface/migration/migration-ctx.interface';
import { MigrationRisk } from '../../../../interface/migration/migration.risk';
import { ISchema } from '../../../../interface/schema/schema.interface';
import { createColumn } from '../create.column';

export const columnCreator = async (
  schema: ISchema,
  ctx: IMigrationContext,
) => {
  if (Object.keys(schema.columns).length) {
    const createColumnsQuery = ctx.knex.schema.alterTable(
      schema.tableName,
      builder => {
        for (const name in schema.columns) {
          if (Object.prototype.hasOwnProperty.call(schema.columns, name)) {
            createColumn(builder, name, schema.columns[name], schema);
          }
        }

        const primaries = ColumnTools.filterPrimary(schema);

        if (primaries.length > 1) {
          builder.primary(primaries);
        }
      },
    );

    ctx.plan.steps.push({
      query: createColumnsQuery,
      risk: MigrationRisk.NONE,
      description: `Create columns for table [${schema.tableName}]`,
      phase: 1,
    });
  }
};
