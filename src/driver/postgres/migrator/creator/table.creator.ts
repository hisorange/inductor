import { IMigrationContext } from '../../../../interface/migration/migration-ctx.interface';
import { MigrationRisk } from '../../../../interface/migration/migration.risk';
import { ISchema } from '../../../../interface/schema/schema.interface';
import { columnCreator } from './column.creator';
import { fkCreator } from './fk.creator';
import { indexCreator } from './index.creator';
import { uniqueCreator } from './unique.creator';

export const tableCreator = async (
  schema: ISchema,
  ctx: IMigrationContext,
): Promise<void> => {
  ctx.plan.steps.push({
    query: ctx.knex.schema.createTable(schema.tableName, () => {}),
    risk: MigrationRisk.NONE,
    description: `Create table [${schema.tableName}]`,
  });

  // Register the fact that the table exits
  ctx.facts.addNewTable(schema.tableName);

  // Add columns
  await columnCreator(schema, ctx);
  // Add indexes
  await indexCreator(schema, ctx);
  // Add uniques
  await uniqueCreator(schema, ctx);
  // Add foreign keys
  await fkCreator(schema, ctx);
};
