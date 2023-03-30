import { IChange } from '../../types/change.interface';
import { MigrationRisk } from '../../types/migration-risk.enum';

export const alterIsUnlogged = ({ context: ctx, target }: IChange) => {
  ctx.plan.steps.push({
    query: ctx.knex.schema.raw(
      `ALTER TABLE "${target.name}" SET ${
        target.isUnlogged ? 'UNLOGGED' : 'LOGGED'
      }`,
    ),
    risk: MigrationRisk.LOW,
    description: `Changing table ${target.name} to ${
      target.isUnlogged ? 'unlogged' : 'logged'
    }`,
    phase: 1,
  });
};
