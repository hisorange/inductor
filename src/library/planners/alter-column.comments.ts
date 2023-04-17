import { IChange } from '../../types/change.interface';
import { MigrationRisk } from '../../types/migration-risk.enum';
import { encodeMetaComment } from '../../utils/meta.coder';

export const alterColumnComments = async (change: IChange, name: string) => {
  const comment = {};

  // Apply meta extensions interested in the column
  change.context.meta
    .filter(meta => meta.interest === 'column')
    .forEach(meta => meta.onWrite(comment, change.target.columns[name].meta));

  change.context.plan.steps.push({
    description: `Alter comment based extensions of column ${name}`,
    phase: 3,
    risk: MigrationRisk.NONE,
    query: change.context.knex.schema.raw(
      `COMMENT ON COLUMN "${
        change.target.name
      }"."${name}" IS '${encodeMetaComment(comment)}'`,
    ),
  });
};
