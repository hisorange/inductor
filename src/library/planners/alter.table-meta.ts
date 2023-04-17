import { IChange } from '../../types/change.interface';
import { MigrationRisk } from '../../types/migration-risk.enum';
import { encodeMetaComment } from '../../utils/meta.coder';

export const alterTableMeta = ({ context, target }: IChange) => {
  // Apply meta encoders interested in the table
  target.meta = target.meta || {};
  const comment = {};

  context.meta
    .filter(ext => ext.interest === 'table')
    .forEach(ext => ext.onWrite(comment, target.meta));

  context.plan.steps.push({
    query: context.knex.schema.raw(
      `COMMENT ON TABLE "${context.knex.raw(
        target.name,
      )}" IS '${context.knex.raw(encodeMetaComment(comment))}'`,
    ),
    risk: MigrationRisk.NONE,
    description: `Changing table ${target.name} comment`,
    phase: 3,
  });
};
