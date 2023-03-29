import { IChange } from '../../types/change.interface';
import { MigrationRisk } from '../../types/migration-risk.enum';
import { encodeComments } from '../../utils/comment.coder';

export const alterCapabilities = async (change: IChange, name: string) => {
  const newComment = encodeComments(change.target.columns[name]);

  change.context.plan.steps.push({
    description: `Alter capabilities of column ${name}`,
    phase: 3,
    risk: MigrationRisk.NONE,
    query: change.context.knex.schema.raw(
      `COMMENT ON COLUMN "${change.target.name}"."${name}" IS '${newComment}'`,
    ),
  });
};
