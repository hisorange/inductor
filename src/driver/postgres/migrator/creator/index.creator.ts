import { IMigrationContext } from '../../../../interface/migration/migration-ctx.interface';
import { MigrationRisk } from '../../../../interface/migration/migration.risk';
import { ISchema } from '../../../../interface/schema/schema.interface';

export const indexCreator = async (schema: ISchema, ctx: IMigrationContext) => {
  // Apply the compositive indexes
  for (const indexName in schema.indexes) {
    if (Object.prototype.hasOwnProperty.call(schema.indexes, indexName)) {
      const createIndexQuery = ctx.knex.schema.alterTable(
        schema.tableName,
        builder =>
          builder.index(
            schema.indexes[indexName].columns,
            indexName,
            schema.indexes[indexName].type,
          ),
      );

      ctx.plan.steps.push({
        query: createIndexQuery,
        risk: MigrationRisk.LOW,
        description: `Create compositive index [${indexName}] for table [${schema.tableName}]`,
      });
    }
  }
};
