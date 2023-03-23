import { ChangeContext } from '../../types/change-context.interface';
import { MigrationRisk } from '../../types/migration-risk.enum';

export const alterIsLogged = ({ ctx, target }: ChangeContext) => {
  ctx.plan.steps.push({
    query: ctx.knex.schema.raw(
      `ALTER TABLE "${target.name}" SET ${
        target.isLogged ? 'LOGGED' : 'UNLOGGED'
      }`,
    ),
    risk: MigrationRisk.LOW,
    description: `Changing table ${target.name} to ${
      target.isLogged ? 'logged' : 'unlogged'
    }`,
    phase: 1,
  });
};
