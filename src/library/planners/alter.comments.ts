import { IChange } from '../../types/change.interface';
import { MigrationRisk } from '../../types/migration-risk.enum';
import { encodeColumnMeta } from '../../utils/meta.coder';

export const alterComments = async (change: IChange, name: string) => {
  const newComment = encodeColumnMeta(change.target.columns[name]);

  change.context.plan.steps.push({
    description: `Alter comment based extensions of column ${name}`,
    phase: 3,
    risk: MigrationRisk.NONE,
    query: change.context.knex.schema.raw(
      `COMMENT ON COLUMN "${change.target.name}"."${name}" IS '${newComment}'`,
    ),
  });
};
