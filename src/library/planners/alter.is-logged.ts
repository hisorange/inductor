import { IChange } from '../../types/change.interface';
import { MigrationRisk } from '../../types/migration-risk.enum';

export const alterIsLogged = ({ context: ctx, target }: IChange) => {
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
