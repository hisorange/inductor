import { IBlueprint } from '../../../../interface/blueprint/blueprint.interface';
import { IMigrationContext } from '../../../../interface/migration/migration-ctx.interface';
import { MigrationRisk } from '../../../../interface/migration/migration.risk';
import { columnCreator } from './column.creator';
import { fkCreator } from './fk.creator';
import { indexCreator } from './index.creator';
import { uniqueCreator } from './unique.creator';

export const tableCreator = async (
  blueprint: IBlueprint,
  ctx: IMigrationContext,
): Promise<void> => {
  ctx.plan.steps.push({
    query: ctx.knex.schema.createTable(blueprint.tableName, () => {}),
    risk: MigrationRisk.NONE,
    description: `Create table [${blueprint.tableName}]`,
    phase: 0,
  });

  // Register the fact that the table exits
  ctx.facts.addNewTable(blueprint.tableName);

  // Add columns
  await columnCreator(blueprint, ctx);
  // Add indexes
  await indexCreator(blueprint, ctx);
  // Add uniques
  await uniqueCreator(blueprint, ctx);
  // Add foreign keys
  await fkCreator(blueprint, ctx);
};
