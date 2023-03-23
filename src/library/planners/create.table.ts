import { IMigrationContext } from '../../types/migration-context.interface';
import { MigrationRisk } from '../../types/migration-risk.enum';
import { ITable } from '../../types/table.interface';

export const createTable = (table: ITable, ctx: IMigrationContext) => {
  ctx.plan.steps.push({
    query: ctx.knex.schema.createTable(table.name, () => {}),
    risk: MigrationRisk.NONE,
    description: `Create table [${table.name}]`,
    phase: 0,
  });

  // Register the fact that the table exits
  ctx.reflection.addTable(table.name);

  // By default each table is created as logged
  // But we can alter the table to be unlogged
  if (!table.isLogged) {
    ctx.plan.steps.push({
      query: ctx.knex.schema.raw(
        `ALTER TABLE ${ctx.knex.client.wrapIdentifier(
          table.name,
        )} SET UNLOGGED`,
      ),
      risk: MigrationRisk.NONE,
      description: `Set table [${table.name}] as unlogged`,
      phase: 0,
    });
  }
};
